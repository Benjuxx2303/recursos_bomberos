import { pool } from "../db.js";
import { sendEmail, generateEmailTemplate } from "../utils/mailer.js";

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