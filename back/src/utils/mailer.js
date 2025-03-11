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
 * Función para generar un delay (pausa) en milisegundos.
 * @param {number} ms - Milisegundos a esperar.
 * @returns {Promise}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Función que intenta enviar un correo con reintentos automáticos si hay fallos temporales.
 * @param {string} to - Dirección del destinatario.
 * @param {string} subject - Asunto del correo.
 * @param {string} text - Contenido en texto plano.
 * @param {string} html - Contenido en HTML.
 * @param {Array} attachments - Lista de archivos adjuntos.
 * @param {number} retries - Número máximo de intentos.
 * @param {number} delayMs - Tiempo de espera inicial entre intentos (se duplica en cada intento fallido).
 */
const retrySendEmail = async (to, subject, text, html, attachments = [], retries = 5, delayMs = 5000) => {
    let consecutive454Errors = 0;  // Contador de errores 454 seguidos

    for (let i = 0; i < retries; i++) {
        try {
            const transporter = createTransporter();
            await transporter.verify();

            const mailOptions = {
                from: `"Cuerpo de Bomberos de Osorno" <${SMTP_USER}>`,
                to,
                subject,
                text,
                html,
                attachments
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Correo enviado a ${to} exitosamente.`);
            return info;

        } catch (error) {
            const smtpCode = error.responseCode || null;

            if (smtpCode === 454) {
                consecutive454Errors++;
                console.warn(`🚨 [ALERTA] Demasiados intentos de inicio de sesión para ${to}. Esperando 15 minutos antes de reintentar...`);

                if (consecutive454Errors >= 3) {
                    console.error(`❌ [ERROR CRÍTICO] Intentos fallidos de inicio de sesión repetidos 3 veces para ${to}. Deteniendo reintentos.`);
                    throw error;
                }

                await delay(900000); // Esperar 15 minutos antes de reintentar
            } else if (smtpCode && [421, 450, 500].includes(smtpCode)) {
                console.warn(`⚠️ [REINTENTO] Error SMTP ${smtpCode} al enviar correo a ${to}: ${error.message}. Reintentando en ${delayMs}ms...`);
                await delay(delayMs);
                delayMs *= 2; // Aumentar el tiempo de espera en cada intento (exponential backoff)
            } else {
                console.error(`❌ [FALLO DEFINITIVO] No se pudo enviar el correo a ${to}.\n🆔 Código de error: ${smtpCode}\n📌 Detalle: ${error.message}`);
                throw error;
            }
        }
    }
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
            console.log(`⏳ [INFO] Correo a ${to} ya fue enviado recientemente. Se omite el reenvío.`);
            return null;  // Evita envíos duplicados en menos de 5s.
        }
    }

    // Usa la función con reintentos en lugar de enviar directamente
    const info = await retrySendEmail(to, subject, text, html, attachments);

    // Registrar el envío para evitar duplicados
    if (!global.lastEmailSent) global.lastEmailSent = {};
    global.lastEmailSent[to] = { timestamp: Date.now(), subject: subject };

    return info;
};

/**
 * Genera una plantilla de correo electrónico en HTML.
 *
 * @param {string} title - Título del correo.
 * @param {string} content - Contenido principal del correo.
 * @param {string} actionUrl - URL para la acción del botón.
 * @param {string} actionText - Texto del botón de acción.
 * @param {boolean} [showButton=true] - Si es `true`, muestra el botón. Si es `false`, no lo muestra.
 * @returns {string} Plantilla de correo HTML.
 */
export const generateEmailTemplate = (title, content, actionUrl, actionText, showButton = true) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
                .header { background: #c0392b; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
                .content { padding: 20px; color: #000; } /* Color de texto negro para el contenido */
                .button { 
                    background-color: #e53e3e; 
                    color: #ffffff; /* Color de texto blanco para el botón */
                    display: inline-block; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold; 
                    margin: 30px auto; 
                    text-align: center; 
                    transition: background-color 0.3s; 
                }
                .button:hover { background-color: #c0392b; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
                .logo { position: absolute; top: 20px; right: 20px; width: 100px; }
                hr { margin: 20px 0; border: 1px solid #eee; }
            </style>
        </head>
        <body>
            <div class="container">
                <img src="https://flotacbo-s3.s3.us-east-2.amazonaws.com/logocbo.png" alt="Logo" class="logo">
                <div class="header">
                    <h2>${title}</h2>
                </div>
                <div class="content">
                    <p>${content}</p>
                    ${showButton ? `
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                            <tr>
                                <td align="center">
                                    <a href="${actionUrl}" class="button">${actionText}</a>
                                </td>
                            </tr>
                        </table>
                    ` : ''}
                    <hr>
                    <p style="font-size: 12px; color: #999;">Este es un correo automático, por favor no respondas a este mensaje.</p>
                </div>
                <div class="footer">
                    <p>Cuerpo de Bomberos de Osorno</p>
                </div>
            </div>
        </body>
        </html>
    `;
};