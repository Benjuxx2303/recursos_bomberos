import { pool } from "../db.js";
import { generateEmailTemplate, sendEmail } from "../utils/mailer.js";
import { saveAndEmitAlert } from "../utils/notifications.js";

export const getAlertasByUsuario = async (req, res) => {
    const { usuario_id } = req.params;
    try {
        // Obtener información del usuario, incluyendo rol y compañía
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

        // Consulta base para alertas
        let query = `
            SELECT DISTINCT
                a.id,
                a.contenido,
                DATE_FORMAT(a.createdAt, '%d-%m-%Y %H:%i') AS createdAt,
                a.tipo,
                COALESCE(ua.isRead, 0) as isRead
            FROM alerta a
            LEFT JOIN usuario_alerta ua ON a.id = ua.alerta_id AND ua.usuario_id = ?
            WHERE (ua.usuario_id = ? OR a.tipo IN ('mantencion', 'combustible'))
            AND a.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;

        const params = [usuario_id, usuario_id];

        // Agregar alertas específicas según el rol
        if (rol === 'TELECOM' || rol === 'Teniente de Máquina' || rol === 'Capitán') {
            query += `
                UNION
                SELECT 
                    m.id,
                    CONCAT('Mantención programada para ', DATE_FORMAT(m.fec_inicio, '%d-%m-%Y'), ' - ', m.descripcion) as contenido,
                    DATE_FORMAT(NOW(), '%d-%m-%Y %H:%i') as createdAt,
                    'mantencion' as tipo,
                    COALESCE(ua.isRead, 0) as isRead
                FROM mantencion m
                INNER JOIN bitacora b ON m.bitacora_id = b.id
                INNER JOIN maquina maq ON b.maquina_id = maq.id
                LEFT JOIN usuario_alerta ua ON m.id = ua.alerta_id AND ua.usuario_id = ?
                WHERE maq.compania_id = ?
                AND m.fec_inicio BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
                AND m.isDeleted = 0
            `;
            params.push(usuario_id, compania_id);
        }

        query += ` ORDER BY createdAt DESC`;

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
        // Consulta SQL para obtener los registros de personal con licencias próximas a vencer o vencidas recientemente
        const [rows] = await pool.query(`
            SELECT 
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
              AND p.ven_licencia BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        `);

        if (rows.length === 0) {
            return res.status(200).json({ message: "No hay permisos próximos a vencer o vencidos recientemente." });
        }

        // Enviar correos y guardar alertas
        for (const personal of rows) {
            const { nombre, apellido, ven_licencia, correo, usuario_id } = personal;
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
        // Consultar máquinas con revisión técnica vencida o próxima a vencer
        const query = `
            SELECT 
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
              AND m.ven_rev_tec <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        `;
        const [rows] = await pool.query(query);

        if (rows.length === 0) {
            return res.status(200).json({ message: "No hay revisiones técnicas próximas a vencer." });
        }

        // Procesar cada máquina y enviar correos a los conductores asignados
        for (const maquina of rows) {
            const { codigo, patente, ven_rev_tec, conductores } = maquina;
            const fechaFormateada = new Date(ven_rev_tec).toLocaleDateString("es-ES");

            if (!conductores) continue;

            const conductoresArray = JSON.parse(`[${conductores}]`);
            for (const conductor of conductoresArray) {
                const { nombre, correo } = conductor;

                // Crear contenido de la alerta
                const contenido = `
                    Hola ${nombre},

                    Te informamos que la revisión técnica de la máquina con patente ${patente} y código ${codigo}
                    vence el ${fechaFormateada}. Por favor, toma las medidas necesarias.
                `;

                // Enviar el correo
                const htmlContent = generateEmailTemplate(
                    "Recordatorio: Vencimiento de Revisión Técnica",
                    "Ver Detalles",
                    "https://example.com/detalles-revision" // Cambiar al enlace real
                );

                await sendEmail(
                    correo,
                    "Recordatorio: Vencimiento de Revisión Técnica",
                    contenido,
                    htmlContent
                );

                // Guardar la alerta en la base de datos
                const insertQuery = `
                    INSERT INTO alerta (usuario_id, contenido, createdAt)
                    VALUES (?, ?, NOW())
                `;
                await pool.query(insertQuery, [conductor.id, contenido]);
            }
        }

        res.status(200).json({ message: "Alertas enviadas y almacenadas correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
}
//TODO: Pulir contenido que viene en el correo
export const sendMantencionAlerts = async (req, res) => {
    try {
        // Consultar mantenciones pendientes
        const query = `
            SELECT 
                m.id AS mantencion_id,
                b.personal_id,
                b.fh_llegada
            FROM mantencion m
            INNER JOIN bitacora b ON m.bitacora_id = b.id
            WHERE b.fh_llegada IS NULL 
              AND m.isDeleted = 0
        `;
        const [rows] = await pool.query(query);

        if (rows.length === 0) {
            return res.status(200).json({ message: "No hay mantenciones pendientes." });
        }

        // Enviar correos y guardar alertas
        for (const maintenance of rows) {
            const { mantencion_id, personal_id } = maintenance;

            // Obtener el correo del personal asignado
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

                // Crear contenido de la alerta
                const contenido = `
                    Hola ${rol},
                    
                    Te recordamos que hay una mantención pendiente para la máquina con ID ${mantencion_id}.
                    Por favor, revisa el sistema para más detalles.
                `;

                // Enviar el correo
                const htmlContent = generateEmailTemplate(
                    "Recordatorio: Mantención Pendiente",
                    "Ver Detalles",
                    "https://example.com/detalles-mantencion" // Cambiar al enlace real
                );

                await sendEmail(
                    correo,
                    "Recordatorio: Mantención Pendiente",
                    contenido,
                    htmlContent
                );
            }

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

        res.status(200).json({ message: "Alertas enviadas y almacenadas correctamente." });
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
};

// Nueva función para enviar alertas de mantenciones próximas
export const sendProximaMantencionAlerts = async (req, res) => {
    try {
        const query = `
            SELECT 
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
            AND m.isDeleted = 0
        `;

        const [mantenciones] = await pool.query(query);

        for (const mantencion of mantenciones) {
            if (!mantencion.usuarios) continue;

            const usuarios = JSON.parse(`[${mantencion.usuarios}]`);
            const fechaFormateada = new Date(mantencion.fec_inicio).toLocaleDateString('es-ES');

            for (const usuario of usuarios) {
                const contenido = `Mantención próxima a realizarse:
                    Máquina: ${mantencion.codigo}
                    Fecha: ${fechaFormateada}
                    Descripción: ${mantencion.descripcion}`;

                // Usar saveAndEmitAlert en lugar de inserción directa
                await saveAndEmitAlert(usuario.id, contenido, 'mantencion');

                // Enviar correo
                const htmlContent = generateEmailTemplate(
                    'Próxima Mantención Programada',
                    'Ver Detalles',
                    `${process.env.FRONTEND_URL}/mantenciones/${mantencion.id}`
                );

                await sendEmail(
                    usuario.correo,
                    'Próxima Mantención Programada',
                    contenido,
                    htmlContent
                );
            }
        }

        if (!res) return;
        res.status(200).json({ message: "Alertas de mantenciones enviadas correctamente" });
    } catch (error) {
        if (!res) return;
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
        
        // Primero, obtener todas las alertas no leídas del usuario
        const [alertas] = await pool.query(`
            SELECT DISTINCT a.id
            FROM alerta a
            LEFT JOIN usuario_alerta ua ON a.id = ua.alerta_id AND ua.usuario_id = ?
            WHERE (ua.usuario_id = ? OR a.tipo IN ('mantencion', 'combustible'))
            AND (ua.isRead = 0 OR ua.isRead IS NULL)
            AND a.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `, [usuario_id, usuario_id]);

        // Marcar cada alerta como leída
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

