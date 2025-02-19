import nodemailer from 'nodemailer';
import {
    SMTP_SERVICE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE
} from '../config.js';

/**
 * Crea un objeto transporter reutilizable para cualquier servicio SMTP configurado.
 */
const createTransporter = () => {
    // Si se ha configurado un servicio SMTP, usa sus valores, si no, usa la configuración por defecto.
    const transporter = nodemailer.createTransport({
        service: SMTP_SERVICE,  
        host: SMTP_HOST,  
        port: SMTP_PORT,  
        secure: SMTP_SECURE,  
        auth: {
            user: SMTP_USER,  
            pass: SMTP_PASS   
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    return transporter;
};

/**
 * Envía un correo electrónico utilizando la configuración SMTP proporcionada.
 * 
 * @param {string} to - Dirección del destinatario.
 * @param {string} subject - Asunto del correo.
 * @param {string} text - Contenido del correo en texto plano.
 * @param {string} html - Contenido del correo en HTML.
 * @param {Array} attachments - Lista de archivos adjuntos (opcional).
 * @throws Error si el correo no puede ser enviado.
 */
export const sendEmail = async (to, subject, text, html, attachments = []) => {
    if (global.lastEmailSent && global.lastEmailSent[to]) {
        const timeDiff = Date.now() - global.lastEmailSent[to].timestamp;
        if (timeDiff < 5000 && global.lastEmailSent[to].subject === subject) {
            return null;  // Evitar el envío de correos duplicados.
        }
    }

    try {
        // Usamos la función para crear el transporter
        const transporter = createTransporter();

        // Verificar si la configuración del transporter es válida
        await transporter.verify();

        // Configurar el correo con los archivos adjuntos
        const mailOptions = {
            from: `"Cuerpo de Bomberos de Osorno" <${SMTP_USER}>`,
            to,
            subject,
            text,
            html,
            attachments  // Se agregan los archivos adjuntos aquí
        };

        // Enviar el correo
        const info = await transporter.sendMail(mailOptions);

        // Registrar el envío para evitar duplicados
        if (!global.lastEmailSent) global.lastEmailSent = {};
        global.lastEmailSent[to] = {
            timestamp: Date.now(),
            subject: subject
        };

        return info;
    } catch (error) {
        console.error('Error al enviar correo:', error);
        throw error;
    }
};

/**
 * Genera una plantilla de correo electrónico en HTML.
 *
 * @param {string} title - Título del correo.
 * @param {string} content - Contenido principal del correo.
 * @param {string} actionUrl - URL para la acción del botón.
 * @param {string} actionText - Texto del botón de acción.
 * @returns {string} Plantilla de correo HTML.
 */
export const generateEmailTemplate = (title, content, actionUrl, actionText) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f8f9fa; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .button { 
                    display: inline-block; 
                    padding: 10px 20px; 
                    background-color: #007bff; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin-top: 20px; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>${title}</h2>
                </div>
                <div class="content">
                    <p>${content}</p>
                    <a href="${actionUrl}" class="button">${actionText}</a>
                </div>
            </div>
        </body>
        </html>
    `;
};
