import { pool } from "../db.js";
import { generateEmailTemplate, sendEmail } from "../utils/mailer.js";
import { getNotificationUsers, createAndSendNotifications } from "../utils/notifications.js";

// Función para obtener información del usuario
const getUserInfo = async (usuarioId) => {
  const userQuery = `
    SELECT 
      u.id,
      u.username,
      rp.nombre AS rol,
      p.compania_id
    FROM usuario u
    INNER JOIN personal p ON u.personal_id = p.id
    INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
    WHERE u.id = ?
  `;
  const [userInfo] = await pool.query(userQuery, [usuarioId]);
  return userInfo[0];
};

// Función para verificar si una alerta similar ya fue enviada en los últimos 7 días
const alertaYaEnviada = async (usuarioId, tipo) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM alerta 
    WHERE usuario_id = ? AND tipo = ? 
    AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
    [usuarioId, tipo]
  );
  return rows[0].count > 0;
};

// Función para obtener alertas por usuario
export const getAlertasByUsuario = async (req, res) => {
  const { usuario_id: usuarioId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  try {
    const userInfo = await getUserInfo(usuarioId);
    if (!userInfo) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const query = `
      SELECT
        a.id,
        a.contenido,
        DATE_FORMAT(a.createdAt, '%d-%m-%Y %H:%i') AS createdAt,
        a.tipo,
        COALESCE(ua.isRead, 0) AS isRead,
        a.createdAt AS createdAtOriginal,
        ua.id AS ua_id,
        ua.alerta_id,
        ua.usuario_id,
        a.idLink
      FROM alerta a
      LEFT JOIN usuario_alerta ua ON a.id = ua.alerta_id AND ua.usuario_id = ?
      WHERE ua.usuario_id = ?
      AND a.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY a.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    const params = [usuarioId, usuarioId, limit, offset];
    const [rows] = await pool.query(query, params);
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// Función para crear un delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Función para enviar alertas de vencimiento de licencias
export const sendVencimientoAlerts = async (req, res) => {
  console.log("Ejecutando sendVencimientoAlerts...");
  try {
    const todosLosUsuariosActivos = await getNotificationUsers();
    
    if (!todosLosUsuariosActivos || todosLosUsuariosActivos.length === 0) {
      console.log("No hay usuarios activos para notificar.");
      if (res) return res.status(200).json({ message: "No hay usuarios activos para notificar." });
      return;
    }
    console.log(`Usuarios activos obtenidos: ${todosLosUsuariosActivos.length}`);

    const [personalConLicenciasPorVencer] = await pool.query(`
      SELECT 
        p.id AS personal_id, 
        p.nombre, 
        p.apellido, 
        p.ven_licencia, 
        u.id AS usuario_id, 
        p.compania_id AS compania_id_personal
      FROM personal p
      INNER JOIN usuario u ON p.id = u.personal_id 
      WHERE p.isDeleted = 0 AND u.isDeleted = 0
      AND p.ven_licencia IS NOT NULL AND p.ven_licencia >= CURDATE(); 
    `);
    
    console.log(`Personal con licencias por vencer (potenciales) encontrado: ${personalConLicenciasPorVencer.length}`);
    const promises = [];

    for (const personal of personalConLicenciasPorVencer) {
      const { personal_id: personalId, nombre, apellido, ven_licencia: venLicencia, compania_id_personal: companiaIdPersonal } = personal;

      if (!venLicencia) continue; 

      const fechaVencimiento = new Date(venLicencia);
      fechaVencimiento.setUTCHours(0, 0, 0, 0); 

      const hoy = new Date();
      hoy.setUTCHours(0, 0, 0, 0);

      const diffTime = fechaVencimiento.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log(`  Procesando licencia de ${nombre} ${apellido} (Personal ID: ${personalId}). Vence en: ${diffDays} días (${fechaVencimiento.toLocaleDateString("es-ES", { timeZone: "UTC" })}).`);

      if (diffDays === 15 || diffDays === 5) {
        console.log(`    ¡ALERTA! Licencia de ${nombre} ${apellido} vence en ${diffDays} días.`);
        
        const contenido = `La licencia de conducir de ${nombre} ${apellido} vence en ${diffDays} días, el ${fechaVencimiento.toLocaleDateString("es-ES", { timeZone: "UTC" })}.`;
        
        const emailConfig = {
          subject: `Alerta: Licencia por Vencer en ${diffDays} días - ${nombre} ${apellido}`,
          redirectUrl: `${process.env.FRONTEND_URL}/#/personal/detalle/${personalId}`,
          buttonText: "Ver Detalles de Personal"
        };

        const evento = {
          tipo_evento: "vencimiento_licencia_conductor",
          compania_id: companiaIdPersonal,
          personal_id_afectado: personalId,
          ingresado_por_usuario_id: null
        };

        promises.push(
          createAndSendNotifications({
            contenido,
            tipo: "vencimiento_licencia",
            idLink: personalId,
            destinatarios: todosLosUsuariosActivos,
            emailConfig,
            evento
          })
        );
      }
    }

    await Promise.allSettled(promises);
    console.log("Proceso sendVencimientoAlerts completado.");
    if (res) {
      return res.status(200).json({ message: "Proceso de alertas de vencimiento ejecutado." });
    }
  } catch (error) {
    console.error("Error en sendVencimientoAlerts:", error);
    if (res) {
      return res.status(500).json({ 
        message: "Error interno del servidor al procesar alertas de vencimiento.", 
        error: error.message 
      });
    }
  }
};

// Función para enviar alertas sobre vencimientos de revisión técnica
export const sendRevisionTecnicaAlerts = async (req, res) => {
    console.log('Ejecutando sendRevisionTecnicaAlerts...');
    try {
        const todosLosUsuariosActivos = await getNotificationUsers();
        if (!todosLosUsuariosActivos || todosLosUsuariosActivos.length === 0) {
            console.log("No hay usuarios activos para notificar sobre revisiones técnicas.");
            if (res) return res.status(200).json({ message: "No hay usuarios activos para notificar." });
            return;
        }

        const [maquinas] = await pool.query(`
            SELECT 
                id,
                codigo,
                ven_rev_tec,
                compania_id
            FROM maquina
            WHERE isDeleted = 0 AND ven_rev_tec IS NOT NULL
        `);

        console.log(`Máquinas encontradas para revisión técnica: ${maquinas.length}`);
        if (maquinas.length === 0) {
            if (res) return res.status(200).json({ message: "No hay máquinas con fechas de revisión técnica para notificar." });
            return;
        }

        const promises = [];
        const hoy = new Date();
        hoy.setUTCHours(0, 0, 0, 0);

        for (const maquina of maquinas) {
            const { id, codigo, ven_rev_tec, compania_id } = maquina;
            const fechaVencimiento = new Date(ven_rev_tec);
            fechaVencimiento.setUTCHours(0, 0, 0, 0);

            const diffTime = fechaVencimiento.getTime() - hoy.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let contenidoAlerta;
            let alertar = false;
            let tipoNotificacionSuffix = "";
            alertar = false; // Inicializar alertar como false

            // Ajustado para cronjobs: solo alertar 15 o 5 días antes.
            if (diffDays === 15 || diffDays === 5) {
                alertar = true;
                contenidoAlerta = `La Revisión Técnica del vehículo ${codigo} vence el ${fechaVencimiento.toLocaleDateString("es-ES", { timeZone: "UTC" })} (en ${diffDays} días).`;
                tipoNotificacionSuffix = `${diffDays}_dias`;
            } 
            // No se contemplan otros casos para este cronjob específico

            if (alertar) {
                console.log(`  Alertando para Revisión Técnica de ${codigo}. Días restantes: ${diffDays}`);
                const emailConfig = {
                    subject: `Alerta Revisión Técnica: ${codigo} - ${diffDays} días restantes`,
                    redirectUrl: `${process.env.FRONTEND_URL}/#/vehiculos/detalle/${id}`,
                    buttonText: "Ver Detalles del Vehículo"
                };

                const evento = {
                    tipo_evento: `revision_tecnica_${tipoNotificacionSuffix}`,
                    compania_id: compania_id,
                    maquina_id_afectada: id,
                    personal_id_afectado: null 
                };

                promises.push(
                    createAndSendNotifications({
                        contenido: contenidoAlerta,
                        tipo: 'revision_tecnica',
                        idLink: id.toString(),
                        destinatarios: todosLosUsuariosActivos,
                        emailConfig,
                        evento
                    })
                );
            }
        }

        await Promise.allSettled(promises);
        console.log('Proceso sendRevisionTecnicaAlerts completado.');
        if (res) {
            res.status(200).json({ message: "Proceso de alertas de revisión técnica ejecutado." });
        }

    } catch (error) {
        console.error("Error en sendRevisionTecnicaAlerts:", error);
        if (res) {
            res.status(500).json({ message: "Error interno del servidor al procesar alertas de revisión técnica.", error: error.message });
        }
    }
};

// Función para enviar alertas sobre vencimientos de patente
export const sendVencimientoPatenteAlerts = async (req, res) => {
    console.log('Ejecutando sendVencimientoPatenteAlerts...');
    try {
        const todosLosUsuariosActivos = await getNotificationUsers();
        if (!todosLosUsuariosActivos || todosLosUsuariosActivos.length === 0) {
            console.log("No hay usuarios activos para notificar sobre vencimiento de patentes.");
            if (res) return res.status(200).json({ message: "No hay usuarios activos para notificar." });
            return;
        }

        const [maquinas] = await pool.query(`
            SELECT 
                id,
                codigo,
                ven_patente,
                compania_id
            FROM maquina
            WHERE isDeleted = 0 AND ven_patente IS NOT NULL
        `);

        console.log(`Máquinas encontradas para alerta de patente: ${maquinas.length}`);
        if (maquinas.length === 0) {
            if (res) return res.status(200).json({ message: "No hay máquinas con fechas de vencimiento de patente para notificar." });
            return;
        }

        const promises = [];
        const hoy = new Date();
        hoy.setUTCHours(0, 0, 0, 0);

        for (const maquina of maquinas) {
            const { id, codigo, ven_patente, compania_id } = maquina;
            const fechaVencimiento = new Date(ven_patente);
            fechaVencimiento.setUTCHours(0, 0, 0, 0);

            const diffTime = fechaVencimiento.getTime() - hoy.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let contenidoAlerta;
            let alertar = false;
            let tipoNotificacionSuffix = "";
            alertar = false; // Inicializar alertar como false

            // Ajustado para cronjobs: solo alertar 15 o 5 días antes.
            if (diffDays === 15 || diffDays === 5) {
                alertar = true;
                contenidoAlerta = `La Patente del vehículo ${codigo} vence el ${fechaVencimiento.toLocaleDateString("es-ES", { timeZone: "UTC" })} (en ${diffDays} días).`;
                tipoNotificacionSuffix = `${diffDays}_dias`;
            }
            // No se contemplan otros casos para este cronjob específico

            if (alertar) {
                console.log(`  Alertando para Patente de ${codigo}. Días restantes: ${diffDays}`);
                const emailConfig = {
                    subject: `Alerta Vencimiento Patente: ${codigo} - ${diffDays} días restantes`,
                    redirectUrl: `${process.env.FRONTEND_URL}/#/vehiculos/detalle/${id}`,
                    buttonText: "Ver Detalles del Vehículo"
                };

                const evento = {
                    tipo_evento: `vencimiento_patente_${tipoNotificacionSuffix}`,
                    compania_id: compania_id,
                    maquina_id_afectada: id,
                    personal_id_afectado: null 
                };

                promises.push(
                    createAndSendNotifications({
                        contenido: contenidoAlerta,
                        tipo: 'vencimiento_patente',
                        idLink: id.toString(),
                        destinatarios: todosLosUsuariosActivos,
                        emailConfig,
                        evento
                    })
                );
            }
        }

        await Promise.allSettled(promises);
        console.log('Proceso sendVencimientoPatenteAlerts completado.');
        if (res) {
            res.status(200).json({ message: "Proceso de alertas de vencimiento de patente ejecutado." });
        }

    } catch (error) {
        console.error("Error en sendVencimientoPatenteAlerts:", error);
        if (res) {
            res.status(500).json({ message: "Error interno del servidor al procesar alertas de vencimiento de patente.", error: error.message });
        }
    }
};

// Función para enviar alertas sobre vencimientos de seguro automotriz
export const sendVencimientoSeguroAlerts = async (req, res) => {
    console.log('Ejecutando sendVencimientoSeguroAlerts...');
    try {
        const todosLosUsuariosActivos = await getNotificationUsers();
        if (!todosLosUsuariosActivos || todosLosUsuariosActivos.length === 0) {
            console.log("No hay usuarios activos para notificar sobre vencimiento de seguros.");
            if (res) return res.status(200).json({ message: "No hay usuarios activos para notificar." });
            return;
        }

        const [maquinas] = await pool.query(`
            SELECT 
                id,
                codigo,
                ven_seg_auto,
                compania_id
            FROM maquina
            WHERE isDeleted = 0 AND ven_seg_auto IS NOT NULL
        `);

        console.log(`Máquinas encontradas para alerta de seguro: ${maquinas.length}`);
        if (maquinas.length === 0) {
            if (res) return res.status(200).json({ message: "No hay máquinas con fechas de vencimiento de seguro para notificar." });
            return;
        }

        const promises = [];
        const hoy = new Date();
        hoy.setUTCHours(0, 0, 0, 0);

        for (const maquina of maquinas) {
            const { id, codigo, ven_seg_auto, compania_id } = maquina;
            const fechaVencimiento = new Date(ven_seg_auto);
            fechaVencimiento.setUTCHours(0, 0, 0, 0);

            const diffTime = fechaVencimiento.getTime() - hoy.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let contenidoAlerta;
            let alertar = false;
            let tipoNotificacionSuffix = "";
            alertar = false; // Inicializar alertar como false

            // Ajustado para cronjobs: solo alertar 15 o 5 días antes.
            if (diffDays === 15 || diffDays === 5) {
                alertar = true;
                contenidoAlerta = `El Seguro Automotriz del vehículo ${codigo} vence el ${fechaVencimiento.toLocaleDateString("es-ES", { timeZone: "UTC" })} (en ${diffDays} días).`;
                tipoNotificacionSuffix = `${diffDays}_dias`;
            }
            // No se contemplan otros casos para este cronjob específico

            if (alertar) {
                console.log(`  Alertando para Seguro Automotriz de ${codigo}. Días restantes: ${diffDays}`);
                const emailConfig = {
                    subject: `Alerta Vencimiento Seguro: ${codigo} - ${diffDays} días restantes`,
                    redirectUrl: `${process.env.FRONTEND_URL}/#/vehiculos/detalle/${id}`,
                    buttonText: "Ver Detalles del Vehículo"
                };

                const evento = {
                    tipo_evento: `vencimiento_seguro_${tipoNotificacionSuffix}`,
                    compania_id: compania_id,
                    maquina_id_afectada: id,
                    personal_id_afectado: null 
                };

                promises.push(
                    createAndSendNotifications({
                        contenido: contenidoAlerta,
                        tipo: 'vencimiento_seguro',
                        idLink: id.toString(),
                        destinatarios: todosLosUsuariosActivos,
                        emailConfig,
                        evento
                    })
                );
            }
        }

        await Promise.allSettled(promises);
        console.log('Proceso sendVencimientoSeguroAlerts completado.');
        if (res) {
            res.status(200).json({ message: "Proceso de alertas de vencimiento de seguro ejecutado." });
        }

    } catch (error) {
        console.error("Error en sendVencimientoSeguroAlerts:", error);
        if (res) {
            res.status(500).json({ message: "Error interno del servidor al procesar alertas de vencimiento de seguro.", error: error.message });
        }
    }
};

// Función para enviar alertas sobre mantenciones
export const sendMantencionAlerts = async (req, res) => {
    console.log('Ejecutando sendMantencionAlerts...');
    try {
        const todosLosUsuariosActivos = await getNotificationUsers();
        if (!todosLosUsuariosActivos || todosLosUsuariosActivos.length === 0) {
            if (res) return res.status(200).json({ message: "No hay usuarios activos para notificar." });
            return;
        }

        const [mantenciones] = await pool.query(`
            SELECT 
                m.id AS mantencion_id,
                m.maquina_id,
                m.descripcion,
                m.fec_inicio,
                maq.codigo AS codigo_maquina,
                maq.compania_id AS compania_id_maquina, // Compañía de la máquina
                p.id AS responsable_id,
                p.nombre AS responsable_nombre,
                u.id AS responsable_usuario_id, // ID de usuario del responsable
                u.correo AS responsable_correo
            FROM mantencion m
            INNER JOIN maquina maq ON m.maquina_id = maq.id
            INNER JOIN personal p ON m.personal_responsable_id = p.id
            LEFT JOIN usuario u ON p.id = u.personal_id
            LEFT JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            WHERE m.isDeleted = 0 
              AND m.fec_inicio IS NOT NULL
              AND (em.nombre IS NULL OR em.nombre != 'Completada')
        `);

        console.log(`Mantenciones programadas encontradas: ${mantenciones.length}`);
        if (mantenciones.length === 0) {
            if (res) return res.status(200).json({ message: "No hay mantenciones programadas para notificar." });
            return;
        }

        const promises = [];

        for (const mantencion of mantenciones) {
            const { mantencion_id, codigo_maquina, descripcion, fec_inicio, responsable_id, compania_id_maquina } = mantencion;

            const fechaMantencion = new Date(fec_inicio);
            fechaMantencion.setUTCHours(0, 0, 0, 0);
            const hoy = new Date();
            hoy.setUTCHours(0, 0, 0, 0);

            const diffTime = fechaMantencion.getTime() - hoy.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let contenidoAlerta;
            let alertar = false;

            if (diffDays === 15 || diffDays === 5) {
                alertar = true;
                contenidoAlerta = `La mantención del vehículo ${codigo_maquina} está programada para el ${fechaMantencion.toLocaleDateString("es-ES", { timeZone: "UTC" })} (en ${diffDays} días). Descripción: ${descripcion}`;
            } else if (diffDays < 5 && diffDays >= 0) {
                alertar = true;
                contenidoAlerta = `¡ATENCIÓN! La mantención del vehículo ${codigo_maquina} es en ${diffDays} días (${fechaMantencion.toLocaleDateString("es-ES", { timeZone: "UTC" })}). Descripción: ${descripcion}`;
            } else if (diffDays < 0) {
                alertar = true;
                contenidoAlerta = `¡URGENTE! La mantención del vehículo ${codigo_maquina} estaba programada para el ${fechaMantencion.toLocaleDateString("es-ES", { timeZone: "UTC" })} y está ATRASADA. Descripción: ${descripcion}`;
            }
            
            if (alertar) {
                console.log(`  Alertando para mantención ID ${mantencion_id} de máquina ${codigo_maquina}. Días restantes/atraso: ${diffDays}`);
                const emailConfig = {
                    subject: `Alerta Mantención: ${codigo_maquina} - ${diffDays} días restantes/atraso`,
                    redirectUrl: `${process.env.FRONTEND_URL}/#/mantenciones/detalle/${mantencion_id}`,
                    buttonText: "Ver Detalles de Mantención"
                };

                const evento = {
                    tipo_evento: 'mantencion_programada_aviso',
                    compania_id: compania_id_maquina,
                    personal_id_afectado: responsable_id, // El responsable de la mantención
                    ingresado_por_usuario_id: null // No es una creación, es un recordatorio/aviso
                };

                promises.push(
                    createAndSendNotifications({
                        contenido: contenidoAlerta,
                        tipo: 'mantencion_programada',
                        idLink: mantencion_id.toString(),
                        destinatarios: todosLosUsuariosActivos,
                        emailConfig,
                        evento
                    })
                );
            }
        }

        await Promise.allSettled(promises);
        console.log('Proceso sendMantencionAlerts completado.');
        if (res) {
            res.status(200).json({ message: "Proceso de alertas de mantención ejecutado." });
        }

    } catch (error) {
        console.error("Error en sendMantencionAlerts:", error);
        if (res) {
            res.status(500).json({ message: "Error interno del servidor al procesar alertas de mantención.", error: error.message });
        }
    }
};

// Función para enviar alertas sobre mantenciones próximas (15 o 5 días antes)
export const sendProximaMantencionAlerts = async (req, res) => {
    console.log('Ejecutando sendProximaMantencionAlerts...');
    try {
        const todosLosUsuariosActivos = await getNotificationUsers();
        if (!todosLosUsuariosActivos || todosLosUsuariosActivos.length === 0) {
            if (res) return res.status(200).json({ message: "No hay usuarios activos para notificar." });
            return;
        }

        const [mantencionesProximas] = await pool.query(`
            SELECT 
                m.id AS mantencion_id, 
                m.descripcion,
                m.fec_inicio, 
                maq.codigo AS codigo_maquina, 
                maq.compania_id AS compania_id_maquina,
                m.personal_responsable_id
            FROM mantencion m
            INNER JOIN bitacora b ON m.bitacora_id = b.id
            INNER JOIN maquina maq ON b.maquina_id = maq.id
            WHERE m.fec_inicio >= CURDATE()  -- Considerar todas las futuras o de hoy
            AND m.isDeleted = 0
            AND m.estado_mantencion_id != (SELECT id FROM estado_mantencion WHERE nombre = 'Completada' LIMIT 1) -- Excluir completadas
        `);

        console.log(`Mantenciones futuras o de hoy encontradas (potenciales para alerta 15/5 días): ${mantencionesProximas.length}`);
        if (mantencionesProximas.length === 0) {
            if (res) return res.status(200).json({ message: "No hay mantenciones futuras o de hoy para notificar." });
            return;
        }

        const promises = [];

        for (const mantencion of mantencionesProximas) {
            const { mantencion_id, descripcion, fec_inicio, codigo_maquina, compania_id_maquina, personal_responsable_id } = mantencion;

            const fechaInicio = new Date(fec_inicio);
            fechaInicio.setUTCHours(0, 0, 0, 0);

            const hoy = new Date();
            hoy.setUTCHours(0, 0, 0, 0);

            const diffTime = fechaInicio.getTime() - hoy.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let alertar = false;
            let contenidoAlerta = "";
            let tipoNotificacionSuffix = "";

            if (diffDays === 15 || diffDays === 5) {
                alertar = true;
                contenidoAlerta = `Recordatorio: La mantención de la máquina ${codigo_maquina} está programada para el ${fechaInicio.toLocaleDateString('es-ES', { timeZone: 'UTC' })} (en ${diffDays} días). Descripción: ${descripcion}`;
                tipoNotificacionSuffix = `${diffDays}_dias`;
            }

            if (alertar) {
                console.log(`  Alertando para mantención próxima ID ${mantencion_id} de máquina ${codigo_maquina}. Días restantes: ${diffDays}`);

                const emailConfig = {
                    subject: `Alerta Mantención Programada: ${codigo_maquina} - ${diffDays} días restantes`,
                    redirectUrl: `${process.env.FRONTEND_URL}/#/mantenciones/detalle/${mantencion_id}`,
                    buttonText: "Ver Detalles de Mantención"
                };

                const evento = {
                    tipo_evento: `mantencion_programada_${tipoNotificacionSuffix}`,
                    compania_id: compania_id_maquina,
                    personal_id_afectado: personal_responsable_id,
                    ingresado_por_usuario_id: null
                };

                promises.push(
                    createAndSendNotifications({
                        contenido: contenidoAlerta,
                        tipo: `mantencion_programada_${tipoNotificacionSuffix}`,
                        idLink: mantencion_id.toString(),
                        destinatarios: todosLosUsuariosActivos,
                        emailConfig,
                        evento,
                        tipoNotificacionSuffix, // Para evitar duplicados si es necesario
                        referencia_id: mantencion_id // Para evitar duplicados si es necesario
                    })
                );
            }
        }

        await Promise.allSettled(promises);
        console.log('Proceso sendProximaMantencionAlerts completado.');
        if (res) {
            res.status(200).json({ message: "Proceso de alertas de mantenciones próximas ejecutado." });
        }

    } catch (error) {
        console.error("Error en sendProximaMantencionAlerts:", error);
        if (res) {
            res.status(500).json({ message: "Error interno del servidor al procesar alertas de mantenciones próximas.", error: error.message });
        }
    }
};

// Función para marcar alertas como leídas
export const markAlertAsRead = async (req, res) => {
  const { alerta_id: alertaId } = req.params;
  const { usuario_id: usuarioId } = req.body;
    
  try {
    await pool.query(
      `
      UPDATE usuario_alerta
      SET isRead = 1
      WHERE alerta_id = ?
      AND usuario_id = ?
      `,
      [alertaId, usuarioId]
    );
        
    return res.status(200).json({ message: "Alerta marcada como leída" });
  } catch (error) {
    return res.status(500).json({ 
      message: "Error al marcar la alerta como leída", 
      error: error.message 
    });
  }
};

// Función para eliminar alertas antiguas
export const deleteOldAlerts = async () => {
  try {
    // Eliminar registros de la tabla "usuario_alerta"
    await pool.query(
      "DELETE FROM usuario_alerta WHERE alerta_id IN (SELECT id FROM alerta WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY))"
    );
        
    // Eliminar registros antiguos en la tabla "alerta"
    await pool.query(
      "DELETE FROM alerta WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
  } catch (error) {
    console.error("Error al eliminar alertas antiguas:", error);
  }
};

// Función para marcar todas las alertas como leídas
export const markAllAlertsAsRead = async (req, res) => {
  const { usuario_id: usuarioId } = req.params;
    
  try {
    await pool.query(
      `
      UPDATE usuario_alerta
      SET isRead = 1
      WHERE usuario_id = ?
      `,
      [usuarioId]
    );
        
    return res.status(200).json({ message: "Todas las alertas marcadas como leídas" });
  } catch (error) {
    return res.status(500).json({ 
      message: "Error al marcar las alertas como leídas", 
      error: error.message 
    });
  }
};