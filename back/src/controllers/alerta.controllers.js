import { pool } from "../db.js";
import { generateEmailTemplate, sendEmail } from "../utils/mailer.js";
import { saveAndEmitAlert } from "../utils/notifications.js";

// Función para obtener información del usuario
const getUserInfo = async (usuario_id) => {
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
    return userInfo[0];
};

// Función para verificar si una alerta similar ya fue enviada en los últimos 7 días
const alertaYaEnviada = async (usuario_id, tipo) => {
    const [rows] = await pool.query(
        `SELECT COUNT(*) as count FROM alerta 
        WHERE usuario_id = ? AND tipo = ? 
        AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [usuario_id, tipo]
    );
    return rows[0].count > 0;
};

// Función para obtener alertas por usuario
export const getAlertasByUsuario = async (req, res) => {
    const { usuario_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const offset = (page - 1) * limit;

    try {
        const userInfo = await getUserInfo(usuario_id);
        if (!userInfo) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const query = `
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
            ORDER BY a.createdAt DESC
            LIMIT ? OFFSET ?
        `;
        const params = [usuario_id, usuario_id, limit, offset];
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Función para crear un delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para enviar alertas de vencimiento de licencias
// TODO: Pulir contenido visual del correo y que se vea más profesional y añadir enlace al sistema (botón acceder).
export const sendVencimientoAlerts = async (req, res) => {
    try {
        // Obtener los correos de los cargos importantes
        const [correosCargosImportantes] = await pool.query(`
            SELECT DISTINCT u.id, u.correo
            FROM personal p
            INNER JOIN usuario u ON p.id = u.personal_id
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            WHERE p.isDeleted = 0 AND u.isDeleted = 0 AND rp.isDeleted = 0
            AND rp.nombre IN ('TELECOM', 'Capitán', 'Teniente de Máquina')
        `);

        // Crear un conjunto para almacenar los correos ya enviados
        const correosEnviados = new Set();

        // Consulta a la base de datos para obtener la información de personal y usuario con licencias a punto de vencer
        const [rows] = await pool.query(`
            SELECT p.id AS personal_id, p.nombre, p.apellido, p.ven_licencia, u.id AS usuario_id, u.correo, rp.nombre AS rol
            FROM personal p
            INNER JOIN usuario u ON p.id = u.personal_id
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            WHERE p.isDeleted = 0 AND u.isDeleted = 0 AND rp.isDeleted = 0
            AND p.ven_licencia BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);
        `);

        // Recorre todos los registros obtenidos de la consulta
        const emailPromises = [];

        for (const personal of rows) {
            const { nombre, apellido, ven_licencia, correo, usuario_id, rol } = personal;

            // Si ya se ha enviado un correo a este usuario, se salta el registro
            if (correosEnviados.has(correo)) continue;

            // Añadir el correo al conjunto para no enviarle más de una alerta
            correosEnviados.add(correo);

            // Convertir la fecha de vencimiento de la licencia a un objeto Date
            const fechaVencimiento = new Date(ven_licencia);
            const hoy = new Date();

            // Calcular la fecha que representa dos meses antes del vencimiento
            const dosMesesAntes = new Date(fechaVencimiento);
            dosMesesAntes.setMonth(fechaVencimiento.getMonth() - 2);

            // Calcular la fecha que representa tres semanas antes del vencimiento
            const tresSemanasAntes = new Date(fechaVencimiento);
            tresSemanasAntes.setDate(fechaVencimiento.getDate() - 21);

            // Variable para almacenar el contenido del correo
            let contenido;
            let contenidoTelecom;

            // Verifica las diferentes condiciones para determinar el tipo de recordatorio
            if (hoy < dosMesesAntes) {
                contenido = `Hola ${nombre} ${apellido}, tu licencia vence el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, renueva a tiempo.`;
                contenidoTelecom = `¡Aviso! El personal ${nombre} ${apellido} tiene su licencia por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}.`;
            } else if (hoy >= dosMesesAntes && hoy < tresSemanasAntes) {
                contenido = `Hola ${nombre} ${apellido}, tu licencia está por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, renueva con anticipación.`;
                contenidoTelecom = `¡Aviso! El personal ${nombre} ${apellido} tiene su licencia por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
            } else {
                contenido = `Hola ${nombre} ${apellido}, tu licencia ya venció el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, renueva con máxima prioridad.`;
                contenidoTelecom = `¡Aviso! El personal ${nombre} ${apellido} tiene su licencia vencida desde el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
            }

            // Generar el contenido HTML para el correo electrónico usando una plantilla
            const htmlContent = generateEmailTemplate(
                "Recordatorio: Vencimiento de Licencia",  // Asunto del correo
                contenido,  // Cuerpo del correo
                `${process.env.FRONTEND_URL}`,  // URL de redirección en el correo
                `Acceder`  // Texto del enlace en el correo
            );

            // Generar el contenido HTML para el correo de TELECOM
            const htmlContentTelecom = generateEmailTemplate(
                "Recordatorio: Vencimiento de Licencia",  // Asunto del correo
                contenidoTelecom,  // Cuerpo del correo
                `${process.env.FRONTEND_URL}`,  // URL de redirección en el correo
                `Acceder`  // Texto del enlace en el correo
            );

            // Agregar a las promesas de correo
            emailPromises.push(
                // Enviar el correo al usuario
                sendEmail(correo, "Recordatorio: Vencimiento de Licencia", contenido, htmlContent),
                // Enviar los correos a los cargos importantes
                ...correosCargosImportantes.map(({ correo: correoCargo, id: cargoId }) =>
                    sendEmail(correoCargo, "Recordatorio: Vencimiento de Licencia", contenidoTelecom, htmlContentTelecom)
                        .then(() => {
                            // Guardar alerta en la base de datos para cada cargo importante (TELECOM, Capitán, Teniente de Máquina)
                            return saveAndEmitAlert(cargoId, contenidoTelecom, 'vencimiento');
                        })
                ),
                // Guardar y emitir la alerta de vencimiento para el usuario
                saveAndEmitAlert(usuario_id, contenido, 'vencimiento')
            );

            // Aplicar un pequeño delay entre los envíos
            await delay(200); // 200ms de retraso entre cada correo
        }

        // Ejecutar todas las promesas de correo en paralelo
        await Promise.all(emailPromises);

        // Responder con un mensaje indicando que las alertas se enviaron correctamente
        res.status(200).json({ message: "Alertas enviadas correctamente." });
    } catch (error) {
        // En caso de error, responder con un mensaje de error y el detalle
        res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
};


// Función para enviar alertas sobre vencimientos de revisión técnica
export const sendRevisionTecnicaAlerts = async (req, res) => {
    try {
        const [correosCargosImportantes] = await pool.query(`
            SELECT DISTINCT u.id, u.correo
            FROM personal p
            INNER JOIN usuario u ON p.id = u.personal_id
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            WHERE p.isDeleted = 0 AND u.isDeleted = 0 AND rp.isDeleted = 0
            AND rp.nombre IN ('TELECOM', 'Capitán', 'Teniente de Máquina')
        `);

        const correosEnviados = new Set();
        const [rows] = await pool.query(`
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
        `);

        if (rows.length === 0) {
            return res.status(200).json({ message: "No hay revisiones técnicas próximas a vencer." });
        }

        const emailPromises = [];

        for (const maquina of rows) {
            const { conductores, ven_rev_tec, codigo } = maquina;
            if (!conductores) continue;

            const conductoresArray = JSON.parse(`[${conductores}]`);
            const fechaVencimiento = new Date(ven_rev_tec);
            const hoy = new Date();
            const dosMesesAntes = new Date(fechaVencimiento);
            dosMesesAntes.setMonth(fechaVencimiento.getMonth() - 2);
            const tresSemanasAntes = new Date(fechaVencimiento);
            tresSemanasAntes.setDate(fechaVencimiento.getDate() - 21);

            for (const conductor of conductoresArray) {
                const { id: usuario_id, nombre, correo } = conductor;

                if (correosEnviados.has(correo)) continue;
                correosEnviados.add(correo);

                let contenido;
                let contenidoTelecom;

                if (hoy < dosMesesAntes) {
                    contenido = `Hola ${nombre}, la revisión técnica está por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, realízala con anticipación.`;
                    contenidoTelecom = `¡Aviso! La revisión técnica del vehículo ${codigo} vence el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, realízala con anticipación.`;
                } else if (hoy >= dosMesesAntes && hoy < tresSemanasAntes) {
                    contenido = `Hola ${nombre}, la revisión técnica está demasiado próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, dar prioridad con urgencia.`;
                    contenidoTelecom = `¡Aviso! La revisión técnica del vehículo ${codigo} está muy próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
                } else {
                    contenido = `Hola ${nombre}, este vehículo ya no puede circular ya que la revisión técnica venció el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, dar máxima prioridad a este carro.`;
                    contenidoTelecom = `¡Aviso! La revisión técnica del vehículo ${codigo} venció el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
                }

                const htmlContent = generateEmailTemplate(
                    "Recordatorio: Vencimiento de Revisión Técnica",
                    contenido,
                    `${process.env.FRONTEND_URL}`,
                    "Ver Detalles"
                );

                const htmlContentTelecom = generateEmailTemplate(
                    "Recordatorio: Vencimiento de Revisión Técnica",
                    contenidoTelecom,
                    `${process.env.FRONTEND_URL}`,
                    "Ver Detalles"
                );

                emailPromises.push(
                    sendEmail(correo, "Recordatorio: Vencimiento de Revisión Técnica", contenido, htmlContent),
                    saveAndEmitAlert(usuario_id, contenido, 'revision_tecnica'),
                    ...correosCargosImportantes.map(({ correo: correoCargo, id: cargoId }) =>
                        sendEmail(correoCargo, "Recordatorio: Vencimiento de Revisión Técnica", contenidoTelecom, htmlContentTelecom)
                            .then(() => saveAndEmitAlert(cargoId, contenidoTelecom, 'revision_tecnica'))
                    )
                );
            }
        }

        await Promise.all(emailPromises);

        // Agregar un timeout de 500ms después de procesar todos los correos
        await new Promise(resolve => setTimeout(resolve, 500));

        res.status(200).json({ message: "Alertas enviadas y almacenadas correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
};


// Función para enviar alertas sobre mantenciones
export const sendMantencionAlerts = async (req, res) => {
    try {
        // Obtener los correos de los cargos importantes
        const [correosCargosImportantes] = await pool.query(`
            SELECT DISTINCT u.id, u.correo
            FROM personal p
            INNER JOIN usuario u ON p.id = u.personal_id
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            WHERE p.isDeleted = 0 AND u.isDeleted = 0 AND rp.isDeleted = 0
            AND rp.nombre IN ('TELECOM', 'Capitán', 'Teniente de Máquina')
        `);

        const correosEnviados = new Set();
        const [rows] = await pool.query(`
            SELECT 
                m.id AS mantencion_id,
                m.maquina_id,
                m.descripcion,
                m.fec_inicio,
                maq.codigo AS codigo_maquina,
                p.id AS responsable_id,
                p.nombre AS responsable_nombre,
                u.correo AS responsable_correo
            FROM mantencion m
            INNER JOIN maquina maq ON m.maquina_id = maq.id
            INNER JOIN personal p ON m.personal_responsable_id = p.id
            LEFT JOIN usuario u ON p.id = u.personal_id
            WHERE m.isDeleted = 0 
              AND m.fec_inicio IS NOT NULL
              AND u.id IS NOT NULL
        `);

        if (rows.length === 0) {
            return res.status(200).json({ message: "No hay mantenciones próximas a realizarse." });
        }

        const emailPromises = [];

        for (const mantencion of rows) {
            const { responsable_id, responsable_nombre, responsable_correo, fec_inicio, codigo_maquina, descripcion } = mantencion;

            if (!responsable_correo || correosEnviados.has(responsable_correo)) continue;
            correosEnviados.add(responsable_correo);

            const fechaMantencion = new Date(fec_inicio).toLocaleDateString("es-ES");
            let contenido = `Hola ${responsable_nombre}, la mantención del vehículo ${codigo_maquina} (${descripcion}) está programada para el ${fechaMantencion}. Por favor, prepárate con anticipación.`;
            let contenidoTelecom = `¡Aviso! La mantención del vehículo ${codigo_maquina} (${descripcion}) está programada para el ${fechaMantencion}. Por favor, coordinar recursos.`;

            const htmlContent = generateEmailTemplate(
                "Recordatorio: Mantención Programada",
                contenido,
                `${process.env.FRONTEND_URL}`,
                "Ver Detalles"
            );

            const htmlContentTelecom = generateEmailTemplate(
                "Recordatorio: Mantención Programada",
                contenidoTelecom,
                `${process.env.FRONTEND_URL}`,
                "Ver Detalles"
            );

            emailPromises.push(
                sendEmail(responsable_correo, "Recordatorio: Mantención Programada", contenido, htmlContent).catch(err => console.error("Error al enviar correo a responsable:", err.message)),
                saveAndEmitAlert(responsable_id, contenido, 'mantencion'),
                ...correosCargosImportantes.map(({ correo: correoCargo, id: cargoId }) =>
                    sendEmail(correoCargo, "Recordatorio: Mantención Programada", contenidoTelecom, htmlContentTelecom)
                        .then(() => saveAndEmitAlert(cargoId, contenidoTelecom, 'mantencion'))
                        .catch(err => console.error("Error al enviar correo a cargo superior:", err.message))
                )
            );
        }

        await Promise.all(emailPromises);

        res.status(200).json({ message: "Alertas de mantención enviadas y almacenadas correctamente." });
    } catch (error) {
        console.error("Error en sendMantencionAlerts:", error);
        res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
};




// Función para enviar alertas sobre mantenciones próximas
export const sendProximaMantencionAlerts = async (req, res) => {
    try {
        // Obtener los correos de los cargos importantes
        const [correosCargosImportantes] = await pool.query(`
            SELECT DISTINCT u.id, u.correo
            FROM personal p
            INNER JOIN usuario u ON p.id = u.personal_id
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            WHERE p.isDeleted = 0 AND u.isDeleted = 0 AND rp.isDeleted = 0
            AND rp.nombre IN ('TELECOM', 'Teniente de Máquina', 'Capitán')
        `);

        const correosEnviados = new Set();
        const [mantenciones] = await pool.query(`
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
        `);

        if (mantenciones.length === 0) {
            return res.status(200).json({ message: "No hay mantenciones próximas a realizarse." });
        }

        const emailPromises = [];

        for (const mantencion of mantenciones) {
            if (!mantencion.usuarios) continue;

            const usuarios = JSON.parse(`[${mantencion.usuarios}]`);
            const fechaFormateada = new Date(mantencion.fec_inicio).toLocaleDateString('es-ES');

            for (const usuario of usuarios) {
                const { nombre, correo, id: usuario_id } = usuario;

                // Si el correo ya fue enviado, se salta
                if (correosEnviados.has(correo)) continue;
                correosEnviados.add(correo);

                // Contenido del correo para el usuario
                const contenido = `Mantención próxima a realizarse: Máquina: ${mantencion.codigo} Fecha: ${fechaFormateada} Descripción: ${mantencion.descripcion}`;

                // Generar el contenido HTML para el correo
                const htmlContent = generateEmailTemplate(
                    'Próxima Mantención Programada',
                    contenido,
                    `${process.env.FRONTEND_URL}/mantenciones/${mantencion.id}`,
                    'Acceder'
                );

                // Agregar las promesas para enviar los correos
                emailPromises.push(
                    sendEmail(correo, 'Próxima Mantención Programada', contenido, htmlContent), // Enviar correo al usuario
                    saveAndEmitAlert(usuario_id, contenido, 'mantencion') // Guardar y emitir la alerta para el usuario
                );

                // Enviar los correos a los cargos importantes
                emailPromises.push(
                    ...correosCargosImportantes.map(({ correo: correoCargo, id: cargoId }) => {
                        const contenidoTelecom = `¡Aviso! La mantención de la máquina ${mantencion.codigo} está próxima a realizarse el ${fechaFormateada}. Descripción: ${mantencion.descripcion}.`;

                        const htmlContentTelecom = generateEmailTemplate(
                            'Próxima Mantención Programada',
                            contenidoTelecom,
                            `${process.env.FRONTEND_URL}/mantenciones/${mantencion.id}`,
                            'Acceder'
                        );

                        return sendEmail(correoCargo, 'Próxima Mantención Programada', contenidoTelecom, htmlContentTelecom)
                            .then(() => saveAndEmitAlert(cargoId, contenidoTelecom, 'mantencion'));
                    })
                );
            }
        }

        // Ejecutar todas las promesas en paralelo
        await Promise.all(emailPromises);

        res.status(200).json({ message: "Alertas de mantenciones enviadas correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
};

// Función para marcar alertas como leídas
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

// Función para eliminar alertas antiguas
export const deleteOldAlerts = async () => {
    try {
        await pool.query(
            'DELETE FROM alerta WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );
    } catch (error) {
        console.error('Error al eliminar alertas antiguas:', error);
    }
};

// Función para marcar todas las alertas como leídas
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