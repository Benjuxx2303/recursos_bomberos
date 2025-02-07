import { pool } from "../db.js";
import { generateEmailTemplate, sendEmail } from "../utils/mailer.js";
import { saveAndEmitAlert } from "../utils/notifications.js";

export const getAlertasByUsuario = async (req, res) => {
    const { usuario_id } = req.params;
    const page = parseInt(req.query.page) || 1; // Página actual
    const limit = 15; // Elementos por página
    const offset = (page - 1) * limit; // Desplazamiento para la consulta

    try {
        // Obtener información del usuario
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
        const [userInfo] = await pool.query(userQuery, [usuario_id]);

        if (!userInfo[0]) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const { rol, compania_id } = userInfo[0];

        // Consulta para obtener alertas
        let query = `
            SELECT
            a.id,
            a.contenido,
            DATE_FORMAT(a.createdAt, '%d-%m-%Y %H:%i') AS createdAt,
            a.tipo,
            COALESCE(ua.isRead, 0) as isRead,
            a.createdAt AS createdAtOriginal
        FROM alerta a
        LEFT JOIN usuario_alerta ua ON a.id = ua.alerta_id AND ua.usuario_id = ?
        WHERE (ua.usuario_id = ? OR a.tipo IN ('mantencion', 'combustible', 'revision_tecnica', 'vencimiento'))
        AND a.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY a.createdAt DESC; -- Sin LIMIT ni OFFSET`;     

        const params = [usuario_id, usuario_id, limit, offset];

        // Ejecutar la consulta
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ 
            message: "Error interno del servidor", 
            error: error.message 
        });
    }
};
/**
 * Enviar alertas por correo y almacenarlas en la base de datos.
 */
export const sendVencimientoAlerts = async (req, res) => {
    try {
        const correosEnviados = new Set(); // Conjunto para verificar duplicados

        const [rows] = await pool.query(`SELECT 
                p.id AS personal_id,
                p.nombre, 
                p.apellido, 
                p.ven_licencia, 
                u.id AS usuario_id,
                u.correo
            FROM personal p
            INNER JOIN usuario u ON p.id = u.personal_id
            WHERE p.isDeleted = 0 
              AND u.isDeleted = 0 
              AND p.ven_licencia BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`);

        if (rows.length === 0) {
            return res.status(200).json({ message: "No hay permisos próximos a vencer o vencidos recientemente." });
        }

        for (const personal of rows) {
            const { nombre, apellido, ven_licencia, correo, usuario_id } = personal;

            if (correosEnviados.has(correo)) continue; // Verificar duplicados
            correosEnviados.add(correo); // Agregar al conjunto

            const fechaFormateada = new Date(ven_licencia).toLocaleDateString("es-ES");

            // **Nueva funcionalidad: Calcular la diferencia en días entre la fecha actual y la fecha de vencimiento**
            const fechaVencimiento = new Date(ven_licencia);
            const fechaActual = new Date();
            const diferenciaDias = Math.floor((fechaVencimiento - fechaActual) / (1000 * 60 * 60 * 24));

            let contenido = '';

            // **Ajustar el mensaje según los días restantes o días de retraso**
            if (diferenciaDias > 0) {
                // Mensaje para licencias que vencen en los próximos días
                contenido = `Hola ${nombre} ${apellido}, te recordamos que tu licencia vence en ${diferenciaDias} días (${fechaFormateada}). Por favor, asegúrate de renovarlo a tiempo.`;
            } else if (diferenciaDias === 0) {
                // Mensaje para el último día antes de la expiración de la licencia
                contenido = `Hola ${nombre} ${apellido}, hoy es el último día para renovar tu licencia (${fechaFormateada}). Por favor, renueva tu licencia lo antes posible.`;
            } else {
                // Mensaje para licencias vencidas, calculando los días de retraso
                const diasRetraso = Math.abs(diferenciaDias);
                contenido = `Hola ${nombre} ${apellido}, tu licencia está vencida hace ${diasRetraso} días (${fechaFormateada}). Por favor, renueva tu licencia lo antes posible para evitar inconvenientes.`;
            }

            // Usar la función saveAndEmitAlert para guardar y emitir la alerta
            await saveAndEmitAlert(usuario_id, contenido, 'vencimiento');

            // Enviar el correo con el contenido ajustado según los días de vencimiento o retraso
            const htmlContent = generateEmailTemplate(
                "Recordatorio: Vencimiento de Licencia",
                "Renovar Licencia",
                "https://example.com/renovar-licencia"
            );

            await sendEmail(
                correo,
                "Recordatorio: Vencimiento de Licencia",
                contenido,
                htmlContent
            );
        }

        res.status(200).json({ message: "Alertas enviadas y almacenadas correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
};
//TODO: EN CASO DE ERROR, REVISAR DESDE AQUÍ
/**
 * Enviar alertas sobre vencimientos de revisión técnica a los conductores asignados.
 */
export const sendRevisionTecnicaAlerts = async (req, res) => {
    try {
        const correosEnviados = new Set(); // Conjunto para verificar duplicados

        const query = `SELECT 
            m.id AS maquina_id,
            m.codigo,
            m.patente,
            m.ven_rev_tec,
            (
                SELECT GROUP_CONCAT(
                    JSON_OBJECT(
                        'id', u.id,
                        'nombre', CONCAT(p.nombre, ' ', p.apellido),
                        'correo', u.correo
                    )
                )
                FROM conductor_maquina cm
                INNER JOIN personal p ON cm.personal_id = p.id
                INNER JOIN usuario u ON p.id = u.personal_id
                WHERE cm.maquina_id = m.id AND cm.isDeleted = 0 AND p.isDeleted = 0 AND u.isDeleted = 0
            ) AS conductores
        FROM maquina m
        WHERE m.isDeleted = 0 
          AND m.ven_rev_tec IS NOT NULL 
          AND m.ven_rev_tec <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)`;
        
        const [rows] = await pool.query(query);

        if (rows.length === 0) {
            return res.status(200).json({ message: "No hay revisiones técnicas próximas a vencer." });
        }

        for (const maquina of rows) {
            const { conductores } = maquina;
            if (!conductores) continue;

            const conductoresArray = JSON.parse(`[${conductores}]`);
            for (const conductor of conductoresArray) {
                const { nombre, correo } = conductor;

                if (correosEnviados.has(correo)) continue; // Verificar duplicados
                correosEnviados.add(correo); // Agregar al conjunto

                const contenido = `Hola ${nombre}, te informamos que la revisión técnica de la máquina con patente ${maquina.patente} y código ${maquina.codigo} vence el ${new Date(maquina.ven_rev_tec).toLocaleDateString("es-ES")}. Por favor, toma las medidas necesarias.`;
                
                const htmlContent = generateEmailTemplate(
                    "Recordatorio: Vencimiento de Revisión Técnica",
                    "Ver Detalles",
                    "https://example.com/detalles-revision"
                );

                await sendEmail(
                    correo,
                    "Recordatorio: Vencimiento de Revisión Técnica",
                    contenido,
                    htmlContent
                );

                await saveAndEmitAlert(conductor.id, contenido, 'revision_tecnica');
            }
        }

        res.status(200).json({ message: "Alertas enviadas y almacenadas correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
};
//TODO: Pulir contenido que viene en el correo
export const sendMantencionAlerts = async (req, res) => {
    try {
        const correosEnviados = new Set(); // Conjunto para verificar duplicados
        const alertasEnviadas = new Set(); // Conjunto para verificar alertas enviadas

        const query = `SELECT 
            m.id AS mantencion_id,
            b.personal_id,
            b.fh_llegada
        FROM mantencion m
        INNER JOIN bitacora b ON m.bitacora_id = b.id
        WHERE b.fh_llegada IS NULL 
          AND m.isDeleted = 0`;
        
        const [rows] = await pool.query(query);

        if (rows.length === 0) {
            return res.status(200).json({ message: "No hay mantenciones pendientes." });
        }

        for (const maintenance of rows) {
            const { personal_id, mantencion_id } = maintenance;

            if (alertasEnviadas.has(mantencion_id)) continue; // Verificar si ya se envió la alerta
            alertasEnviadas.add(mantencion_id); // Agregar al conjunto

            const [personal] = await pool.query(`
                SELECT 
                    u.correo,
                    rp.nombre AS rol
                FROM personal p
                INNER JOIN usuario u ON p.id = u.personal_id
                INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
                WHERE p.id = ? AND p.isDeleted = 0
            `, [personal_id]);

            if (personal.length > 0) {
                const { correo, rol } = personal[0];

                if (correosEnviados.has(correo)) continue; // Verificar duplicados
                correosEnviados.add(correo); // Agregar al conjunto

                const contenido = `Hola ${rol}, te recordamos que hay una mantención pendiente para la máquina con ID ${mantencion_id}. Por favor, revisa el sistema para más detalles.`;
                
                const htmlContent = generateEmailTemplate(
                    "Recordatorio: Mantención Pendiente",
                    "Ver Detalles",
                    "https://example.com/detalles-mantencion"
                );

                await sendEmail(
                    correo,
                    "Recordatorio: Mantención Pendiente",
                    contenido,
                    htmlContent
                );

                // Obtener roles superiores
                const superiorRoles = ['TELECOM', 'Teniente de Máquina'];
                const [superiorPersonal] = await pool.query(`
                    SELECT 
                        u.correo 
                    FROM personal p
                    INNER JOIN usuario u ON p.id = u.personal_id
                    INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
                    WHERE rp.nombre IN (?) AND p.isDeleted = 0
                `, [superiorRoles]);

                // Enviar alertas a roles superiores
                for (const superior of superiorPersonal) {
                    await sendEmail(
                        superior.correo,
                        "Recordatorio: Mantención Pendiente",
                        `Estimado(a), hay una mantención pendiente para la máquina con ID ${mantencion_id}.`,
                        `<!DOCTYPE html>
                        <html>
                        <body>
                            <h3>Alerta de Mantención Pendiente</h3>
                            <p>Estimado(a),</p>
                            <p>Hay una mantención pendiente para la máquina con ID <strong>${mantencion_id}</strong>.</p>
                            <p>Por favor, revisa el sistema para más detalles.</p>
                        </body>
                        </html>`
                    );
                }
            }
        }

        res.status(200).json({ message: "Alertas enviadas y almacenadas correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
};

// Nueva función para enviar alertas de mantenciones próximas
export const sendProximaMantencionAlerts = async (req, res) => {
    try {
        const correosEnviados = new Set(); // Conjunto para verificar duplicados

        const query = `SELECT 
            m.id,
            m.descripcion,
            m.fec_inicio,
            maq.codigo,
            maq.compania_id,
            (
                SELECT GROUP_CONCAT(
                    JSON_OBJECT(
                        'id', u.id,
                        'correo', u.correo,
                        'nombre', CONCAT(p.nombre, ' ', p.apellido),
                        'rol', rp.nombre
                    )
                )
                FROM usuario u
                INNER JOIN personal p ON u.personal_id = p.id
                INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
                WHERE p.compania_id = maq.compania_id
                AND rp.nombre IN ('TELECOM', 'Teniente de Máquina', 'Capitán')
                AND u.isDeleted = 0
            ) as usuarios
        FROM mantencion m
        INNER JOIN bitacora b ON m.bitacora_id = b.id
        INNER JOIN maquina maq ON b.maquina_id = maq.id
        WHERE m.fec_inicio BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND m.isDeleted = 0`;

        const [mantenciones] = await pool.query(query);

        for (const mantencion of mantenciones) {
            if (!mantencion.usuarios) continue;

            const usuarios = JSON.parse(`[${mantencion.usuarios}]`);
            const fechaFormateada = new Date(mantencion.fec_inicio).toLocaleDateString('es-ES');

            for (const usuario of usuarios) {
                const { nombre, correo } = usuario;

                if (correosEnviados.has(correo)) continue; // Verificar duplicados
                correosEnviados.add(correo); // Agregar al conjunto

                const contenido = `Mantención próxima a realizarse: Máquina: ${mantencion.codigo} Fecha: ${fechaFormateada} Descripción: ${mantencion.descripcion}`;

                await saveAndEmitAlert(usuario.id, contenido, 'mantencion');

                const htmlContent = generateEmailTemplate(
                    'Próxima Mantención Programada',
                    'Ver Detalles',
                    `${process.env.FRONTEND_URL}/mantenciones/${mantencion.id}`
                );

                await sendEmail(
                    correo,
                    'Próxima Mantención Programada',
                    contenido,
                    htmlContent
                );
            }
        }

        res.status(200).json({ message: "Alertas de mantenciones enviadas correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Nueva función para marcar alertas como leídas
export const markAlertAsRead = async (req, res) => {
    const { alerta_id } = req.params;
    const { usuario_id } = req.body;
    
    try {
        await pool.query(
            'UPDATE alerta SET isRead = true WHERE id = ? AND usuario_id = ?',
            [alerta_id, usuario_id]
        );
        
        res.status(200).json({ message: "Alerta marcada como leída" });
    } catch (error) {
        res.status(500).json({ 
            message: "Error al marcar la alerta como leída", 
            error: error.message 
        });
    }
};

// Nueva función para eliminar alertas antiguas
export const deleteOldAlerts = async () => {
    try {
        await pool.query(
            'DELETE FROM alerta WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );
    } catch (error) {
        console.error('Error al eliminar alertas antiguas:', error);
    }
};

export const markAllAlertsAsRead = async (req, res) => {
    const { usuario_id } = req.params;
    
    try {
        const [alertas] = await pool.query(`
            SELECT DISTINCT a.id
            FROM alerta a
            LEFT JOIN usuario_alerta ua ON a.id = ua.alerta_id AND ua.usuario_id = ?
            WHERE (ua.usuario_id = ? OR a.tipo IN ('mantencion', 'combustible'))
            AND (ua.isRead = 0 OR ua.isRead IS NULL)
            AND a.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `, [usuario_id, usuario_id]);

        for (const alerta of alertas) {
            await pool.query(`
                INSERT INTO usuario_alerta (usuario_id, alerta_id, isRead)
                VALUES (?, ?, 1)
                ON DUPLICATE KEY UPDATE isRead = 1
            `, [usuario_id, alerta.id]);
        }

        res.status(200).json({ 
            message: "Todas las alertas marcadas como leídas",
            count: alertas.length
        });
    } catch (error) {
        console.error('Error en markAllAlertsAsRead:', error);
        res.status(500).json({ 
            message: "Error al marcar las alertas como leídas", 
            error: error.message 
        });
    }
};

