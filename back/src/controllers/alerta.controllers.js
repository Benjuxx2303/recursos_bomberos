import { pool } from "../db.js";
import { sendEmail, generateEmailTemplate } from "../utils/mailer.js";

export const getAlertasByUsuario = async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const query = `
              SELECT 
              a.id AS id,
              a.usuario_id AS usuario_id,
              u.username AS usuario,
              p.nombre AS nombre,
              p.apellido AS apellido,
              p.rut AS rut,
              a.contenido AS contenido,
              DATE_FORMAT(a.createdAt, '%d-%m-%Y %H:%i') AS createdAt
              FROM alerta a
              INNER JOIN usuario u ON a.usuario_id = u.id
              INNER JOIN personal p ON u.personal_id = p.id
              WHERE usuario_id = ?
              ORDER BY createdAt DESC
              LIMIT 10
              `;
    const [rows] = await pool.query(query, [usuario_id]);

    if (rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No hay alertas para este usuario." });
    }

    // Limpiar el contenido de saltos de línea innecesarios
    rows[0].contenido = rows[0].contenido.replace(/\n\s*/g, " ").trim();

    res.status(200).json(rows[0]);
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};  

/**
 * Enviar alertas por correo y almacenarlas en la base de datos.
 */
export const sendVencimientoAlerts = async (req, res) => {
    try {
        // Consultar permisos próximos a vencer en los próximos 7 días
        const query = `
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
              AND p.ven_licencia BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        `;
        const [rows] = await pool.query(query);

        if (rows.length === 0) {
            return res.status(200).json({ message: "No hay permisos próximos a vencer." });
        }

        // Enviar correos y guardar alertas
        for (const personal of rows) {
            const { nombre, apellido, ven_licencia, correo, usuario_id } = personal;
            const fechaFormateada = new Date(ven_licencia).toLocaleDateString("es-ES");

            // Crear contenido de la alerta
            const contenido = `
                Hola ${nombre} ${apellido},
                
                Te recordamos que tu permiso de circulación vence el ${fechaFormateada}.
                Por favor, asegúrate de renovarlo a tiempo.
            `;

            // Enviar el correo
            const htmlContent = generateEmailTemplate(
                "Recordatorio: Próximo Vencimiento de Permiso",
                "Renovar Permiso",
                "https://example.com/renovar-permiso" // Cambiar al enlace real
            );

            await sendEmail(
                correo,
                "Recordatorio: Próximo Vencimiento de Permiso",
                contenido,
                htmlContent
            );

            // Guardar la alerta en la base de datos
            const insertQuery = `
                INSERT INTO alerta (usuario_id, contenido, createdAt)
                VALUES (?, ?, NOW())
            `;
            await pool.query(insertQuery, [usuario_id, contenido]);
        }

        res.status(200).json({ message: "Alertas enviadas y almacenadas correctamente." });
    } catch (error) {
        console.error("Error enviando alertas: ", error);
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
        console.error("Error enviando alertas: ", error);
        res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
}
//TODO: RECIBIR ALERTA PARA PROXIMA MANTENCIÓN DE MAQUINAS