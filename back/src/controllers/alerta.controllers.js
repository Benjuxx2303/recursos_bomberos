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
// TODO: Pulir contenido visual del correo y que se vea más profesional y añadir enlace al sistema (botón acceder).
export const sendVencimientoAlerts = async (req, res) => {
    try {
        // Obtener los correos de los cargos importantes
        const cargosImportantes = await getNotificationUsers({ cargos_importantes: true });
        // console.log(cargosImportantes);

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
            const hoy = new Date();

            // Calcular la fecha que representa dos meses antes del vencimiento
            const dosMesesAntes = new Date(fechaVencimiento);
            dosMesesAntes.setMonth(fechaVencimiento.getMonth() - 2);

            // Calcular la fecha que representa tres semanas antes del vencimiento
            const tresSemanasAntes = new Date(fechaVencimiento);
            tresSemanasAntes.setDate(fechaVencimiento.getDate() - 21);

            // Variable para almacenar el contenido del correo
            let contenido;
            let contenidoCargoImportante;
            let contenidoCapitan;

            // Verifica las diferentes condiciones para determinar el tipo de recordatorio
            if (hoy < dosMesesAntes) {
                contenido = `Hola ${nombre} ${apellido}, tu licencia vence el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, renueva a tiempo.`;
                contenidoCargoImportante = `¡Aviso! El personal ${nombre} ${apellido} tiene su licencia por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}.`;
                contenidoCapitan = `Capitán, el personal ${nombre} ${apellido} de su compañía tiene su licencia por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}.`;
            } else if (hoy >= dosMesesAntes && hoy < tresSemanasAntes) {
                contenido = `Hola ${nombre} ${apellido}, tu licencia está por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, renueva con anticipación.`;
                contenidoCargoImportante = `¡Aviso! El personal ${nombre} ${apellido} tiene su licencia por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
                contenidoCapitan = `Capitán, el personal ${nombre} ${apellido} de su compañía tiene su licencia por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
            } else {
                contenido = `Hola ${nombre} ${apellido}, tu licencia ya venció el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, renueva con máxima prioridad.`;
                contenidoCargoImportante = `¡Aviso! El personal ${nombre} ${apellido} tiene su licencia vencida desde el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
                contenidoCapitan = `Capitán, el personal ${nombre} ${apellido} de su compañía tiene su licencia vencida desde el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con máxima prioridad.`;
            }

            // Generar el contenido HTML para el correo electrónico usando una plantilla
            const htmlContent = generateEmailTemplate(
                "Recordatorio: Vencimiento de Licencia",  // Asunto del correo
                contenido,  // Cuerpo del correo
                `${process.env.FRONTEND_URL}`,  // URL de redirección en el correo
                `Acceder`  // Texto del enlace en el correo
            );

            // Generar el contenido HTML para el correo de cargos importantes
            const htmlContentCargoImportante = generateEmailTemplate(
                "Recordatorio: Vencimiento de Licencia",  // Asunto del correo
                contenidoCargoImportante,  // Cuerpo del correo
                `${process.env.FRONTEND_URL}`,  // URL de redirección en el correo
                `Acceder`  // Texto del enlace en el correo
            );

            // Generar el contenido HTML para el correo del capitán
            const htmlContentCapitan = generateEmailTemplate(
                "Recordatorio: Vencimiento de Licencia",  // Asunto del correo
                contenidoCapitan,  // Cuerpo del correo
                `${process.env.FRONTEND_URL}`,  // URL de redirección en el correo
                `Acceder`  // Texto del enlace en el correo
            );

            // Agregar a las promesas de correo
            emailPromises.push(
                // Enviar el correo al usuario
                sendEmail(correo, "Recordatorio: Vencimiento de Licencia", contenido, htmlContent),
                // Enviar los correos a los cargos importantes
                ...cargosImportantes.map(({ correo: correoCargo, id: cargoId }) =>
                    sendEmail(correoCargo, "Recordatorio: Vencimiento de Licencia", contenidoCargoImportante, htmlContentCargoImportante)
                        .then(() => {
                            // Guardar alerta en la base de datos para cada cargo importante (TELECOM, Comandante, Inspector Material Mayor)
                            return saveAndEmitAlert(cargoId, contenidoCargoImportante, 'vencimiento', personal_id);
                        })
                ),
                // Enviar correo al capitán de la compañía del usuario
                ...(await getNotificationUsers({ compania_id: compania_id, rol: 'Capitán' })).map(({ correo: correoCapitan, id: capitanId }) =>
                    sendEmail(correoCapitan, "Recordatorio: Vencimiento de Licencia", contenidoCapitan, htmlContentCapitan)
                        .then(() => {
                            // Guardar alerta en la base de datos para el capitán
                            return saveAndEmitAlert(capitanId, contenidoCapitan, 'vencimiento', personal_id);
                        })
                ),
                // Guardar y emitir la alerta de vencimiento para el usuario
                saveAndEmitAlert(usuario_id, contenido, 'vencimiento', personal_id)
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
        // Obtener los correos de los cargos importantes
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
                (
                    SELECT GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', u.id,
                            'nombre', CONCAT(p.nombre, ' ', p.apellido),
                            'correo', u.correo,
                            'compania', c.nombre,
                            'rol', rp.nombre
                        )
                    )
                    FROM conductor_maquina cm
                    INNER JOIN personal p ON cm.personal_id = p.id
                    INNER JOIN usuario u ON p.id = u.personal_id
                    INNER JOIN compania c ON p.compania_id = c.id
                    INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
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
            const { conductores, ven_rev_tec, codigo, patente, maquina_id } = maquina;
            if (!conductores) continue;

            const conductoresArray = JSON.parse(`[${conductores}]`);
            const fechaVencimiento = new Date(ven_rev_tec);
            const hoy = new Date();
            const dosMesesAntes = new Date(fechaVencimiento);
            dosMesesAntes.setMonth(fechaVencimiento.getMonth() - 2);
            const tresSemanasAntes = new Date(fechaVencimiento);
            tresSemanasAntes.setDate(fechaVencimiento.getDate() - 21);

            for (const conductor of conductoresArray) {
                const { id: usuario_id, nombre, correo, compania, rol } = conductor;

                if (correosEnviados.has(correo)) continue;
                correosEnviados.add(correo);

                let contenido;
                let contenidoCargoImportante;
                let contenidoCapitan;
                let contenidoTenienteMaquina;

                if (hoy < dosMesesAntes) {
                    contenido = `Hola ${nombre}, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} está por vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, realízala con anticipación.`;
                    contenidoCargoImportante = `¡Aviso! La revisión técnica del vehículo con código: ${codigo} - patente: ${patente} vence el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, realízala con anticipación.`;
                    contenidoCapitan = `Capitán, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía vence el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, asegúrese de que se realice a tiempo.`;
                    contenidoTenienteMaquina = `Teniente de Máquina, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía vence el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, asegúrese de que se realice a tiempo.`;
                } else if (hoy >= dosMesesAntes && hoy < tresSemanasAntes) {
                    contenido = `Hola ${nombre}, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} está demasiado próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, dar prioridad con urgencia.`;
                    contenidoCargoImportante = `¡Aviso! La revisión técnica del vehículo código: ${codigo} - patente: ${patente} está muy próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
                    contenidoCapitan = `Capitán, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía está muy próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
                    contenidoTenienteMaquina = `Teniente de Máquina, la revisión técnica del vehículo código: ${codigo} - patente: ${patente} de su compañía está muy próxima a vencer el ${fechaVencimiento.toLocaleDateString("es-ES")}. Actuar con urgencia.`;
                } else {
                    contenido = `Hola ${nombre}, el vehículo código: ${codigo} - patente: ${patente} ya no puede circular ya que la revisión técnica venció el ${fechaVencimiento.toLocaleDateString("es-ES")}. Por favor, dar máxima prioridad a este carro.`;
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

                emailPromises.push(
                    sendEmail(correo, "Recordatorio: Vencimiento de Revisión Técnica", contenido, htmlContent),
                    saveAndEmitAlert(usuario_id, contenido, 'revision_tecnica', maquina_id),
                    ...cargosImportantes.map(({ correo: correoCargo, id: cargoId }) =>
                        sendEmail(correoCargo, "Recordatorio: Vencimiento de Revisión Técnica", contenidoCargoImportante, htmlContentCargoImportante)
                            .then(() => saveAndEmitAlert(cargoId, contenidoCargoImportante, 'revision_tecnica', maquina_id))
                    ),
                    ...(await getNotificationUsers({ compania_id: compania, rol: 'Capitán' })).map(({ correo: correoCapitan, id: capitanId }) =>
                        sendEmail(correoCapitan, "Recordatorio: Vencimiento de Revisión Técnica", contenidoCapitan, htmlContentCapitan)
                            .then(() => saveAndEmitAlert(capitanId, contenidoCapitan, 'revision_tecnica', maquina_id))
                    ),
                    ...(await getNotificationUsers({ compania_id: compania, rol: 'Teniente de Máquina' })).map(({ correo: correoTeniente, id: tenienteId }) =>
                        sendEmail(correoTeniente, "Recordatorio: Vencimiento de Revisión Técnica", contenidoTenienteMaquina, htmlContentTenienteMaquina)
                            .then(() => saveAndEmitAlert(tenienteId, contenidoTenienteMaquina, 'revision_tecnica', maquina_id))
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

            const fechaMantencion = new Date(fec_inicio).toLocaleDateString("es-ES");

            // Contenido para el usuario común
            const contenido = `Hola ${responsable_nombre}, la mantención del vehículo ${codigo_maquina} está programada para el ${fechaMantencion}. Por favor, prepárate con anticipación. Descripción: (${descripcion})`;

            // Contenido para cargos importantes
            const contenidoCargoImportante = `¡Aviso! La mantención del vehículo ${codigo_maquina} está programada para el ${fechaMantencion}. Por favor, coordinar recursos. Descripción: (${descripcion})`;

            // Contenido para el capitán
            const contenidoCapitan = `Capitán, la mantención del vehículo ${codigo_maquina} está programada para el ${fechaMantencion}. Por favor, coordinar recursos. Descripción: (${descripcion})`;

            // Generar contenido HTML
            const htmlContent = generateEmailTemplate("Recordatorio: Mantención Programada", contenido, `${process.env.FRONTEND_URL}`, "Ver Detalles");
            const htmlContentCargoImportante = generateEmailTemplate("Recordatorio: Mantención Programada", contenidoCargoImportante, `${process.env.FRONTEND_URL}`, "Ver Detalles");
            const htmlContentCapitan = generateEmailTemplate("Recordatorio: Mantención Programada", contenidoCapitan, `${process.env.FRONTEND_URL}`, "Ver Detalles");

            // Enviar correo al responsable
            await sendEmail(responsable_correo, "Recordatorio: Mantención Programada", contenido, htmlContent);
            await saveAndEmitAlert(responsable_id, contenido, 'mantencion', mantencion_id);

            // Enviar correos a cargos importantes
            await Promise.all(cargosImportantes.map(({ correo: correoCargo, id: cargoId }) =>
                sendEmail(correoCargo, "Recordatorio: Mantención Programada", contenidoCargoImportante, htmlContentCargoImportante)
                    .then(() => saveAndEmitAlert(cargoId, contenidoCargoImportante, 'mantencion', mantencion_id))
            ));

            // Enviar correo al capitán de la compañía del responsable
            const capitanes = await getNotificationUsers({ compania_id: compania_id, rol: 'Capitán' });
            await Promise.all(capitanes.map(({ correo: correoCapitan, id: capitanId }) =>
                sendEmail(correoCapitan, "Recordatorio: Mantención Programada", contenidoCapitan, htmlContentCapitan)
                    .then(() => saveAndEmitAlert(capitanId, contenidoCapitan, 'mantencion', mantencion_id))
            ));

            // Enviar correo al teniente de máquina
            const tenientes = await getNotificationUsers({ compania_id: compania_id, rol: 'Teniente de Máquina' });
            await Promise.all(tenientes.map(({ correo: correoTeniente, id: tenienteId }) =>
                sendEmail(correoTeniente, "Recordatorio: Mantención Programada", contenidoCapitan, htmlContentCapitan)
                    .then(() => saveAndEmitAlert(tenienteId, contenidoCapitan, 'mantencion', mantencion_id))
            ));
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
                m.id AS mantencion_id, m.descripcion, m.fec_inicio, maq.codigo, maq.compania_id
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

            // Obtener usuarios comunes de la compañía de la mantención
            const usuariosComunes = await getNotificationUsers({ compania_id: mantencion.compania_id });

            const { mantencion_id } = mantencion;

            for (const usuario of usuariosComunes) {
                const { nombre, correo, id: usuario_id, rol } = usuario;

                // Si ya se ha enviado un correo a este usuario, se salta el registro
                if (correosEnviados.has(correo)) continue;
                correosEnviados.add(correo);

                // Contenido específico para el usuario común
                const htmlContent = generateEmailTemplate('Próxima Mantención Programada', contenidoBase, url, 'Acceder');
                emailPromises.push(
                    sendEmail(correo, 'Próxima Mantención Programada', contenidoBase, htmlContent),
                    saveAndEmitAlert(usuario_id, contenidoBase, 'mantencion', mantencion_id)
                );

                // Enviar correos a cargos importantes
                if (rol === 'Capitán') {
                    const contenidoCapitan = `Capitán, la mantención de la máquina ${mantencion.codigo} está próxima a realizarse el ${fechaFormateada}. Descripción: ${mantencion.descripcion}.`;
                    const htmlContentCapitan = generateEmailTemplate('Próxima Mantención Programada', contenidoCapitan, url, 'Acceder');
                    emailPromises.push(
                        ...cargosImportantes.map(({ correo: correoCargo, id: cargoId }) =>
                            sendEmail(correoCargo, 'Próxima Mantención Programada', contenidoCapitan, htmlContentCapitan)
                                .then(() => saveAndEmitAlert(cargoId, contenidoCapitan, 'mantencion', mantencion_id))
                        )
                    );
                }

                // Enviar correo al Teniente de Máquina
                if (rol === 'Teniente de Máquina') {
                    const contenidoTeniente = `Teniente, la mantención de la máquina ${mantencion.codigo} está próxima a realizarse el ${fechaFormateada}. Descripción: ${mantencion.descripcion}.`;
                    const htmlContentTeniente = generateEmailTemplate('Próxima Mantención Programada', contenidoTeniente, url, 'Acceder');
                    emailPromises.push(
                        sendEmail(correo, 'Próxima Mantención Programada', contenidoTeniente, htmlContentTeniente)
                            .then(() => saveAndEmitAlert(usuario_id, contenidoTeniente, 'mantencion', mantencion_id))
                    );
                }
            }

            // Enviar alertas a cargos importantes
            for (const { correo: correoCargo, id: cargoId } of cargosImportantes) {
                const contenidoCargoImportante = `¡Aviso! La mantención de la máquina ${mantencion.codigo} está próxima a realizarse el ${fechaFormateada}. Descripción: ${mantencion.descripcion}.`;
                const htmlContentCargoImportante = generateEmailTemplate('Próxima Mantención Programada', contenidoCargoImportante, url, 'Acceder');
                emailPromises.push(
                    sendEmail(correoCargo, 'Próxima Mantención Programada', contenidoCargoImportante, htmlContentCargoImportante)
                        .then(() => saveAndEmitAlert(cargoId, contenidoCargoImportante, 'mantencion', mantencion_id))
                );
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