import { pool } from "../db.js";
import { generateEmailTemplate, sendEmail } from "../utils/mailer.js";
import { getNotificationUsers, saveAndEmitAlert } from "../utils/notifications.js";

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
export const sendVencimientoAlerts = async (req, res) => {
    try {
        // Obtener los correos de los cargos importantes
        const cargosImportantes = await getNotificationUsers({ cargos_importantes: true });

        // Crear un conjunto para almacenar los correos ya enviados
        const correosEnviados = new Set();

        // Consulta a la base de datos para obtener la información de personal y usuario con licencias a punto de vencer
        const [rows] = await pool.query(`
            SELECT p.id AS personal_id, p.nombre, p.apellido, p.ven_licencia, u.id AS usuario_id, u.correo, rp.nombre AS rol, c.id AS compania_id
            FROM personal p
            INNER JOIN usuario u ON p.id = u.personal_id
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            WHERE p.isDeleted = 0 AND u.isDeleted = 0 AND rp.isDeleted = 0
            AND p.ven_licencia BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);
        `);

        // Recorre todos los registros obtenidos de la consulta
        const emailPromises = [];

        for (const personal of rows) {
            const { nombre, apellido, ven_licencia, correo, usuario_id, rol, compania_id, personal_id } = personal;

            // Si ya se ha enviado un correo a este usuario, se salta el registro
            if (correosEnviados.has(correo)) continue;

            // Añadir el correo al conjunto para no enviarle más de una alerta
            correosEnviados.add(correo);

            // Convertir la fecha de vencimiento de la licencia a un objeto Date
            const fechaVencimiento = new Date(ven_licencia);
            fechaVencimiento.setHours(0, 0, 0, 0); // Normalizar a medianoche

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche

            const quinceDiasAntes = new Date(fechaVencimiento);
            quinceDiasAntes.setDate(quinceDiasAntes.getDate() - 15); // Restar 15 días
            quinceDiasAntes.setHours(0, 0, 0, 0); // Normalizar a medianoche

            const cincoDiasAntes = new Date(fechaVencimiento);
            cincoDiasAntes.setDate(cincoDiasAntes.getDate() - 5); // Restar 5 días
            cincoDiasAntes.setHours(0, 0, 0, 0); // Normalizar a medianoche

            let contenido;
            let contenidoCargoImportante;
            let contenidoTenienteMaquina;

            // Si la fecha de vencimiento es futura
            if (fechaVencimiento > hoy) {
                if (hoy < quinceDiasAntes) {
                    contenido = `Hola ${nombre} ${apellido}, tu licencia vence el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, renueva a tiempo.`;
                    contenidoCargoImportante = `¡Aviso! El personal ${nombre} ${apellido} tiene su licencia por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}.`;
                    contenidoTenienteMaquina = `Teniente de Máquina, el personal ${nombre} ${apellido} de su compañía tiene su licencia por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}.`;
                } else if (hoy >= quinceDiasAntes && hoy < cincoDiasAntes) {
                    contenido = `Hola ${nombre} ${apellido}, tu licencia está próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, renueva con anticipación.`;
                    contenidoCargoImportante = `¡Aviso! El personal ${nombre} ${apellido} tiene su licencia próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
                    contenidoTenienteMaquina = `Teniente de Máquina, el personal ${nombre} ${apellido} de su compañía tiene su licencia próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
                } else {
                    contenido = `Hola ${nombre} ${apellido}, tu licencia está muy próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, renueva con máxima prioridad.`;
                    contenidoCargoImportante = `¡Aviso! El personal ${nombre} ${apellido} tiene su licencia muy próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
                    contenidoTenienteMaquina = `Teniente de Máquina, el personal ${nombre} ${apellido} de su compañía tiene su licencia muy próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
                }
            } else {
                // Si la fecha de vencimiento ya pasó
                contenido = `Hola ${nombre} ${apellido}, tu licencia ya venció el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, renueva con máxima prioridad.`;
                contenidoCargoImportante = `¡Aviso! El personal ${nombre} ${apellido} tiene su licencia vencida desde el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
                contenidoTenienteMaquina = `Teniente de Máquina, el personal ${nombre} ${apellido} de su compañía tiene su licencia vencida desde el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
            }

            // Generar el contenido HTML para el correo electrónico usando una plantilla
            const htmlContent = generateEmailTemplate(
                "Recordatorio: Vencimiento de Licencia",
                contenido,
                `${process.env.FRONTEND_URL}`,
                "Acceder"
            );

            // Generar el contenido HTML para el correo de cargos importantes
            const htmlContentCargoImportante = generateEmailTemplate(
                "Recordatorio: Vencimiento de Licencia",
                contenidoCargoImportante,
                `${process.env.FRONTEND_URL}`,
                "Acceder"
            );

            // Generar el contenido HTML para el correo del teniente de máquina
            const htmlContentTenienteMaquina = generateEmailTemplate(
                "Recordatorio: Vencimiento de Licencia",
                contenidoTenienteMaquina,
                `${process.env.FRONTEND_URL}`,
                "Acceder"
            );

            // Agregar a las promesas de correo
            emailPromises.push(
                // Enviar el correo al usuario
                sendEmail(correo, "Recordatorio: Vencimiento de Licencia", contenido, htmlContent),
                // Guardar y emitir la alerta de vencimiento para el usuario
                saveAndEmitAlert(usuario_id, contenido, 'vencimiento', personal_id)
            );

            // Enviar notificaciones a cargos importantes
            for (const { correo: correoCargo, id: cargoId } of cargosImportantes) {
                if (correosEnviados.has(correoCargo)) continue;
                correosEnviados.add(correoCargo);

                emailPromises.push(
                    sendEmail(correoCargo, "Recordatorio: Vencimiento de Licencia", contenidoCargoImportante, htmlContentCargoImportante),
                    saveAndEmitAlert(cargoId, contenidoCargoImportante, 'vencimiento', personal_id)
                );
            }

            // Enviar notificaciones a Tenientes de Máquina
            const tenientes = await getNotificationUsers({ compania_id: compania_id, rol: 'Teniente de Máquina' });
            for (const { correo: correoTeniente, id: tenienteId } of tenientes) {
                if (correosEnviados.has(correoTeniente)) continue;
                correosEnviados.add(correoTeniente);

                emailPromises.push(
                    sendEmail(correoTeniente, "Recordatorio: Vencimiento de Licencia", contenidoTenienteMaquina, htmlContentTenienteMaquina),
                    saveAndEmitAlert(tenienteId, contenidoTenienteMaquina, 'vencimiento', personal_id)
                );
            }
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
        // Obtener los correos de los cargos importantes (escalafón alto)
        const cargosImportantes = await getNotificationUsers({ cargos_importantes: true });

        // Crear un conjunto para almacenar los correos ya enviados
        const correosEnviados = new Set();

        // Consulta a la base de datos para obtener la información de las máquinas con revisiones técnicas próximas a vencer
        const [rows] = await pool.query(`
            SELECT 
                m.id AS maquina_id,
                m.codigo,
                m.patente,
                m.ven_rev_tec,
                c.id AS compania_id,
                c.nombre AS compania_nombre
            FROM maquina m
            INNER JOIN compania c ON m.compania_id = c.id
            WHERE m.isDeleted = 0 
              AND m.ven_rev_tec IS NOT NULL
        `);

        if (rows.length === 0) {
            return res.status(200).json({ message: "No hay revisiones técnicas próximas a vencer." });
        }

        const emailPromises = [];

        for (const maquina of rows) {
            const { ven_rev_tec, codigo, patente, maquina_id, compania_id, compania_nombre } = maquina;
            
            const fechaVencimiento = new Date(ven_rev_tec);
            fechaVencimiento.setHours(0, 0, 0, 0); // Normalizar a medianoche

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche

            const quinceDiasAntes = new Date(fechaVencimiento);
            quinceDiasAntes.setDate(quinceDiasAntes.getDate() - 15); // Restar 15 días
            quinceDiasAntes.setHours(0, 0, 0, 0); // Normalizar a medianoche

            const cincoDiasAntes = new Date(fechaVencimiento);
            cincoDiasAntes.setDate(cincoDiasAntes.getDate() - 5); // Restar 5 días
            cincoDiasAntes.setHours(0, 0, 0, 0); // Normalizar a medianoche

            // Obtener usuarios que no sean Maquinista ni Conductor Rentado
            const usuariosNotificables = await getNotificationUsers({ 
                compania_id: compania_id,
                exclude_roles: ['Maquinista', 'Conductor Rentado']
            });

            let contenido;
            let contenidoCargoImportante;
            let contenidoCapitan;
            let contenidoTenienteMaquina;

            // Si la fecha de vencimiento es futura
            if (fechaVencimiento > hoy) {
                if (hoy < quinceDiasAntes) {
                    contenido = `La revisión técnica del vehículo código: ${codigo} - patente: ${patente} vence el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, realícela con anticipación.`;
                    contenidoCargoImportante = `¡Aviso! La revisión técnica del vehículo con código: ${codigo} - patente: ${patente} vence el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, realícela con anticipación.`;
                    contenidoCapitan = `Capitán, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía vence el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, asegúrese de que se realice a tiempo.`;
                    contenidoTenienteMaquina = `Teniente de Máquina, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía vence el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, asegúrese de que se realice a tiempo.`;
                } else if (hoy >= quinceDiasAntes && hoy < cincoDiasAntes) {
                    contenido = `La revisión técnica del vehículo código: ${codigo} - patente: ${patente} está próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, dar prioridad con urgencia.`;
                    contenidoCargoImportante = `¡Aviso! La revisión técnica del vehículo código: ${codigo} - patente: ${patente} está próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
                    contenidoCapitan = `Capitán, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía está próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
                    contenidoTenienteMaquina = `Teniente de Máquina, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía está próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
                } else {
                    contenido = `La revisión técnica del vehículo código: ${codigo} - patente: ${patente} está muy próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, dar máxima prioridad a este carro.`;
                    contenidoCargoImportante = `¡Aviso! La revisión técnica del vehículo código: ${codigo} - patente: ${patente} está muy próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
                    contenidoCapitan = `Capitán, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía está muy próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
                    contenidoTenienteMaquina = `Teniente de Máquina, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía está muy próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
                }
            } else {
                // Si la fecha de vencimiento ya pasó
                contenido = `El vehículo código: ${codigo} - patente: ${patente} ya no puede circular ya que la revisión técnica venció el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, dar máxima prioridad a este carro.`;
                contenidoCargoImportante = `¡Aviso! La revisión técnica del vehículo código: ${codigo} - patente: ${patente} venció el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
                contenidoCapitan = `Capitán, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía venció el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
                contenidoTenienteMaquina = `Teniente de Máquina, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía venció el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
            }

            const htmlContent = generateEmailTemplate(
                "Recordatorio: Vencimiento de Revisión Técnica",
                contenido,
                `${process.env.FRONTEND_URL}`,
                "Ver Detalles"
            );

            const htmlContentCargoImportante = generateEmailTemplate(
                "Recordatorio: Vencimiento de Revisión Técnica",
                contenidoCargoImportante,
                `${process.env.FRONTEND_URL}`,
                "Ver Detalles"
            );

            const htmlContentCapitan = generateEmailTemplate(
                "Recordatorio: Vencimiento de Revisión Técnica",
                contenidoCapitan,
                `${process.env.FRONTEND_URL}`,
                "Ver Detalles"
            );

            const htmlContentTenienteMaquina = generateEmailTemplate(
                "Recordatorio: Vencimiento de Revisión Técnica",
                contenidoTenienteMaquina,
                `${process.env.FRONTEND_URL}`,
                "Ver Detalles"
            );

            // Enviar notificaciones a usuarios notificables
            for (const usuario of usuariosNotificables) {
                const { correo, id: usuario_id } = usuario;
                if (correosEnviados.has(correo)) continue;
                correosEnviados.add(correo);

                emailPromises.push(
                    sendEmail(correo, "Recordatorio: Vencimiento de Revisión Técnica", contenido, htmlContent),
                    saveAndEmitAlert(usuario_id, contenido, 'revision_tecnica', maquina_id)
                );
            }

            // Enviar notificaciones a cargos importantes (escalafón alto)
            for (const { correo: correoCargo, id: cargoId } of cargosImportantes) {
                if (correosEnviados.has(correoCargo)) continue;
                correosEnviados.add(correoCargo);

                emailPromises.push(
                    sendEmail(correoCargo, "Recordatorio: Vencimiento de Revisión Técnica", contenidoCargoImportante, htmlContentCargoImportante),
                    saveAndEmitAlert(cargoId, contenidoCargoImportante, 'revision_tecnica', maquina_id)
                );
            }

            // Enviar notificaciones a Capitanes de la compañía
            const capitanes = await getNotificationUsers({ compania_id: compania_id, rol: 'Capitán' });
            for (const { correo: correoCapitan, id: capitanId } of capitanes) {
                if (correosEnviados.has(correoCapitan)) continue;
                correosEnviados.add(correoCapitan);

                emailPromises.push(
                    sendEmail(correoCapitan, "Recordatorio: Vencimiento de Revisión Técnica", contenidoCapitan, htmlContentCapitan),
                    saveAndEmitAlert(capitanId, contenidoCapitan, 'revision_tecnica', maquina_id)
                );
            }

            // Enviar notificaciones a Tenientes de Máquina
            const tenientes = await getNotificationUsers({ compania_id: compania_id, rol: 'Teniente de Máquina' });
            for (const { correo: correoTeniente, id: tenienteId } of tenientes) {
                if (correosEnviados.has(correoTeniente)) continue;
                correosEnviados.add(correoTeniente);

                emailPromises.push(
                    sendEmail(correoTeniente, "Recordatorio: Vencimiento de Revisión Técnica", contenidoTenienteMaquina, htmlContentTenienteMaquina),
                    saveAndEmitAlert(tenienteId, contenidoTenienteMaquina, 'revision_tecnica', maquina_id)
                );
            }
        }

        await Promise.all(emailPromises);
        res.status(200).json({ message: "Alertas enviadas y almacenadas correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
};

// Función para enviar alertas sobre mantenciones
export const sendMantencionAlerts = async (req, res) => {
    try {
        // Obtener los correos de los cargos importantes
        const cargosImportantes = await getNotificationUsers({ cargos_importantes: true });

        // Crear un conjunto para almacenar los correos ya enviados
        const correosEnviados = new Set();

        // Consulta a la base de datos para obtener la información de mantenciones
        const [rows] = await pool.query(`
            SELECT 
                m.id AS mantencion_id,
                m.maquina_id,
                m.descripcion,
                m.fec_inicio,
                maq.codigo AS codigo_maquina,
                p.id AS responsable_id,
                p.nombre AS responsable_nombre,
                u.correo AS responsable_correo,
                rp.nombre AS responsable_rol,
                c.id AS compania_id,
                c.nombre AS responsable_compania
            FROM mantencion m
            INNER JOIN maquina maq ON m.maquina_id = maq.id
            INNER JOIN personal p ON m.personal_responsable_id = p.id
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            LEFT JOIN usuario u ON p.id = u.personal_id
            WHERE m.isDeleted = 0 
              AND m.fec_inicio IS NOT NULL
              AND u.id IS NOT NULL
        `);

        if (rows.length === 0) {
            return res.status(200).json({ message: "No hay mantenciones próximas a realizarse." });
        }

        const emailPromises = rows.map(async (mantencion) => {
            const { responsable_id, responsable_nombre, responsable_correo, responsable_rol, responsable_compania, fec_inicio, codigo_maquina, descripcion, compania_id, mantencion_id } = mantencion;

            if (!responsable_correo || correosEnviados.has(responsable_correo)) return;
            correosEnviados.add(responsable_correo);

            const fechaMantencion = new Date(fec_inicio);
            fechaMantencion.setHours(0, 0, 0, 0); // Normalizar a medianoche

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche

            const quinceDiasAntes = new Date(fechaMantencion);
            quinceDiasAntes.setDate(quinceDiasAntes.getDate() - 15); // Restar 15 días
            quinceDiasAntes.setHours(0, 0, 0, 0); // Normalizar a medianoche

            const cincoDiasAntes = new Date(fechaMantencion);
            cincoDiasAntes.setDate(cincoDiasAntes.getDate() - 5); // Restar 5 días
            cincoDiasAntes.setHours(0, 0, 0, 0); // Normalizar a medianoche

            // Obtener usuarios que no sean Maquinista ni Conductor Rentado
            const usuariosNotificables = await getNotificationUsers({ 
                compania_id: compania_id,
                exclude_roles: ['Maquinista', 'Conductor Rentado']
            });

            let contenido;
            let contenidoCargoImportante;
            let contenidoTenienteMaquina;

            // Si la fecha de mantención es futura
            if (fechaMantencion > hoy) {
                if (hoy < quinceDiasAntes) {
                    contenido = `La mantención del vehículo ${codigo_maquina} está programada para el ${fechaMantencion.toLocaleDateString("es-ES")}. Por favor, prepárese con anticipación. Descripción: (${descripcion})`;
                    contenidoCargoImportante = `¡Aviso! La mantención del vehículo ${codigo_maquina} está programada para el ${fechaMantencion.toLocaleDateString("es-ES")}. Por favor, coordinar recursos. Descripción: (${descripcion})`;
                    contenidoTenienteMaquina = `Teniente de Máquina, la mantención del vehículo ${codigo_maquina} está programada para el ${fechaMantencion.toLocaleDateString("es-ES")}. Por favor, coordinar recursos. Descripción: (${descripcion})`;
                } else if (hoy >= quinceDiasAntes && hoy < cincoDiasAntes) {
                    contenido = `La mantención del vehículo ${codigo_maquina} está próxima a realizarse el ${fechaMantencion.toLocaleDateString("es-ES")}. Por favor, dar prioridad con urgencia. Descripción: (${descripcion})`;
                    contenidoCargoImportante = `¡Aviso! La mantención del vehículo ${codigo_maquina} está próxima a realizarse el ${fechaMantencion.toLocaleDateString("es-ES")}. Actuar con urgencia. Descripción: (${descripcion})`;
                    contenidoTenienteMaquina = `Teniente de Máquina, la mantención del vehículo ${codigo_maquina} está próxima a realizarse el ${fechaMantencion.toLocaleDateString("es-ES")}. Actuar con urgencia. Descripción: (${descripcion})`;
                } else {
                    contenido = `La mantención del vehículo ${codigo_maquina} está muy próxima a realizarse el ${fechaMantencion.toLocaleDateString("es-ES")}. Por favor, dar máxima prioridad. Descripción: (${descripcion})`;
                    contenidoCargoImportante = `¡Aviso! La mantención del vehículo ${codigo_maquina} está muy próxima a realizarse el ${fechaMantencion.toLocaleDateString("es-ES")}. Actuar con máxima prioridad. Descripción: (${descripcion})`;
                    contenidoTenienteMaquina = `Teniente de Máquina, la mantención del vehículo ${codigo_maquina} está muy próxima a realizarse el ${fechaMantencion.toLocaleDateString("es-ES")}. Actuar con máxima prioridad. Descripción: (${descripcion})`;
                }
            } else {
                // Si la fecha de mantención ya pasó
                contenido = `La mantención del vehículo ${codigo_maquina} ya debería haberse realizado el ${fechaMantencion.toLocaleDateString("es-ES")}. Por favor, dar máxima prioridad. Descripción: (${descripcion})`;
                contenidoCargoImportante = `¡Aviso! La mantención del vehículo ${codigo_maquina} ya debería haberse realizado el ${fechaMantencion.toLocaleDateString("es-ES")}. Actuar con máxima prioridad. Descripción: (${descripcion})`;
                contenidoTenienteMaquina = `Teniente de Máquina, la mantención del vehículo ${codigo_maquina} ya debería haberse realizado el ${fechaMantencion.toLocaleDateString("es-ES")}. Actuar con máxima prioridad. Descripción: (${descripcion})`;
            }

            const htmlContent = generateEmailTemplate(
                "Recordatorio: Mantención Programada",
                contenido,
                `${process.env.FRONTEND_URL}`,
                "Ver Detalles"
            );

            const htmlContentCargoImportante = generateEmailTemplate(
                "Recordatorio: Mantención Programada",
                contenidoCargoImportante,
                `${process.env.FRONTEND_URL}`,
                "Ver Detalles"
            );

            const htmlContentTenienteMaquina = generateEmailTemplate(
                "Recordatorio: Mantención Programada",
                contenidoTenienteMaquina,
                `${process.env.FRONTEND_URL}`,
                "Ver Detalles"
            );

            // Enviar notificaciones a usuarios notificables
            for (const usuario of usuariosNotificables) {
                const { correo, id: usuario_id } = usuario;
                if (correosEnviados.has(correo)) continue;
                correosEnviados.add(correo);

                emailPromises.push(
                    sendEmail(correo, "Recordatorio: Mantención Programada", contenido, htmlContent),
                    saveAndEmitAlert(usuario_id, contenido, 'mantencion', mantencion_id)
                );
            }

            // Enviar notificaciones a cargos importantes
            for (const { correo: correoCargo, id: cargoId } of cargosImportantes) {
                if (correosEnviados.has(correoCargo)) continue;
                correosEnviados.add(correoCargo);

                emailPromises.push(
                    sendEmail(correoCargo, "Recordatorio: Mantención Programada", contenidoCargoImportante, htmlContentCargoImportante),
                    saveAndEmitAlert(cargoId, contenidoCargoImportante, 'mantencion', mantencion_id)
                );
            }

            // Enviar notificaciones a Tenientes de Máquina
            const tenientes = await getNotificationUsers({ compania_id: compania_id, rol: 'Teniente de Máquina' });
            for (const { correo: correoTeniente, id: tenienteId } of tenientes) {
                if (correosEnviados.has(correoTeniente)) continue;
                correosEnviados.add(correoTeniente);

                emailPromises.push(
                    sendEmail(correoTeniente, "Recordatorio: Mantención Programada", contenidoTenienteMaquina, htmlContentTenienteMaquina),
                    saveAndEmitAlert(tenienteId, contenidoTenienteMaquina, 'mantencion', mantencion_id)
                );
            }
        });

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
        const cargosImportantes = await getNotificationUsers({ cargos_importantes: true });

        // Crear un conjunto para evitar envíos duplicados
        const correosEnviados = new Set();

        // Obtener mantenciones próximas
        const [mantenciones] = await pool.query(`
            SELECT 
                m.id AS mantencion_id, 
                m.descripcion, 
                m.fec_inicio, 
                maq.codigo, 
                maq.compania_id,
                m.personal_responsable_id
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
            const fechaFormateada = new Date(mantencion.fec_inicio).toLocaleDateString('es-ES');
            const contenidoBase = `Mantención próxima a realizarse: Máquina: ${mantencion.codigo} Fecha: ${fechaFormateada} Descripción: ${mantencion.descripcion}`;
            const url = `${process.env.FRONTEND_URL}/mantenciones/${mantencion.id}`;

            // Obtener usuarios que no sean Maquinista ni Conductor Rentado
            const usuariosNotificables = await getNotificationUsers({ 
                compania_id: mantencion.compania_id,
                exclude_roles: ['Maquinista', 'Conductor Rentado']
            });

            const { mantencion_id, personal_responsable_id } = mantencion;

            // Enviar notificaciones a usuarios notificables
            for (const usuario of usuariosNotificables) {
                const { correo, id: usuario_id, rol } = usuario;

                // Si ya se ha enviado un correo a este usuario, se salta el registro
                if (correosEnviados.has(correo)) continue;
                correosEnviados.add(correo);

                // Contenido específico para el usuario común
                const htmlContent = generateEmailTemplate('Próxima Mantención Programada', contenidoBase, url, 'Acceder');
                emailPromises.push(
                    sendEmail(correo, 'Próxima Mantención Programada', contenidoBase, htmlContent),
                    saveAndEmitAlert(usuario_id, contenidoBase, 'mantencion', mantencion_id)
                );
            }

            // Enviar notificaciones a cargos importantes
            for (const { correo: correoCargo, id: cargoId } of cargosImportantes) {
                if (correosEnviados.has(correoCargo)) continue;
                correosEnviados.add(correoCargo);

                const contenidoCargoImportante = `¡Aviso! La mantención de la máquina ${mantencion.codigo} está próxima a realizarse el ${fechaFormateada}. Descripción: ${mantencion.descripcion}.`;
                const htmlContentCargoImportante = generateEmailTemplate('Próxima Mantención Programada', contenidoCargoImportante, url, 'Acceder');
                emailPromises.push(
                    sendEmail(correoCargo, 'Próxima Mantención Programada', contenidoCargoImportante, htmlContentCargoImportante),
                    saveAndEmitAlert(cargoId, contenidoCargoImportante, 'mantencion', mantencion_id)
                );
            }

            // Enviar notificaciones a Tenientes de Máquina
            const tenientes = await getNotificationUsers({ compania_id: mantencion.compania_id, rol: 'Teniente de Máquina' });
            for (const { correo: correoTeniente, id: tenienteId } of tenientes) {
                if (correosEnviados.has(correoTeniente)) continue;
                correosEnviados.add(correoTeniente);

                const contenidoTeniente = `Teniente de Máquina, la mantención de la máquina ${mantencion.codigo} está próxima a realizarse el ${fechaFormateada}. Descripción: ${mantencion.descripcion}.`;
                const htmlContentTeniente = generateEmailTemplate('Próxima Mantención Programada', contenidoTeniente, url, 'Acceder');
                emailPromises.push(
                    sendEmail(correoTeniente, 'Próxima Mantención Programada', contenidoTeniente, htmlContentTeniente),
                    saveAndEmitAlert(tenienteId, contenidoTeniente, 'mantencion', mantencion_id)
                );
            }

            // Si el responsable es Maquinista o Conductor Rentado, enviar notificación solo a él
            if (personal_responsable_id) {
                const responsable = await getNotificationUsers({ personal_id: personal_responsable_id });
                if (responsable.length > 0) {
                    const { correo: correoResponsable, id: responsableId, rol: rolResponsable } = responsable[0];
                    if (['Maquinista', 'Conductor Rentado'].includes(rolResponsable)) {
                        if (!correosEnviados.has(correoResponsable)) {
                            correosEnviados.add(correoResponsable);
                            const contenidoResponsable = `Hola, la mantención de la máquina ${mantencion.codigo} está próxima a realizarse el ${fechaFormateada}. Descripción: ${mantencion.descripcion}.`;
                            const htmlContentResponsable = generateEmailTemplate('Próxima Mantención Programada', contenidoResponsable, url, 'Acceder');
                            emailPromises.push(
                                sendEmail(correoResponsable, 'Próxima Mantención Programada', contenidoResponsable, htmlContentResponsable),
                                saveAndEmitAlert(responsableId, contenidoResponsable, 'mantencion', mantencion_id)
                            );
                        }
                    }
                }
            }
        }

        await Promise.all(emailPromises);
        res.status(200).json({ message: "Alertas enviadas correctamente." });
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
            `
            UPDATE usuario_alerta
            SET isRead = 1
            WHERE alerta_id = ?
            AND usuario_id = ?
            `,
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
        // Eliminar registros de la tabla "usuario_alerta"
        await pool.query(
            'DELETE FROM usuario_alerta WHERE alerta_id IN (SELECT id FROM alerta WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY))'
        );
        
        // Eliminar registros antiguos en la tabla "alerta"
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
        await pool.query(
            `
            UPDATE usuario_alerta
            SET isRead = 1
            WHERE usuario_id = ?
            `,
            [usuario_id]
        );
        
        res.status(200).json({ message: "Alerta marcada como leída" });
    } catch (error) {
        res.status(500).json({ 
            message: "Error al marcar la alerta como leída", 
            error: error.message 
        });
    }
};