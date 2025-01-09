import nodemailer from 'nodemailer';
import {
    GMAIL_PASS,
    GMAIL_USER
} from '../config.js';

// Crear el transporter
/**
 * Creates a transporter object using the default SMTP transport.
 * 
 * This transporter is configured to use Gmail as the email service.
 * Ensure that the environment variables `GMAIL_USER` and `GMAIL_PASS` are set in your .env file.
 * 
 * @constant {Object} transporter - The transporter object for sending emails.
 * @property {string} service - The email service to use (Gmail).
 * @property {Object} auth - The authentication object.
 * @property {string} auth.user - The Gmail user email address.
 * @property {string} auth.pass - The Gmail application-specific password.
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Usamos Gmail como servicio de correo
    auth: {
        user: GMAIL_USER,  // Debes agregar este valor en tu .env
        pass: GMAIL_PASS  // Usa una contraseña de aplicación para Gmail
    }
});

// Función para enviar correos
/**
 * Sends an email using the configured transporter.
 *
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The plain text content of the email.
 * @param {string} html - The HTML content of the email.
 * @throws Will throw an error if the email could not be sent.
 */
export const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: GMAIL_USER,  // Correo desde el cual se enviará
            to,
            subject,
            text,
            html
        });
        console.log("Correo enviado: " + info.response);
    } catch (error) {
        console.error("Error enviando correo: ", error);
        throw error;
    }
};

/**
 * Generates an HTML email template with the given title, link text, and link.
 *
 * @param {string} title - The title of the email.
 * @param {string} linkText - The text to display for the link.
 * @param {string} link - The URL for the link.
 * @returns {string} The generated HTML email template.
 */
export const generateEmailTemplate = (title, linkText, link) => {
    return `
    <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4; /* Color de fondo neutro */
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff; /* Fondo blanco */
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background-color: #D32F2F; /* Rojo intenso */
                    color: #ffffff;
                    text-align: center;
                    padding: 20px 0;
                }
                .header h2 {
                    margin: 0;
                    font-size: 24px;
                }
                .content {
                    padding: 20px;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #555;
                }
                .content p {
                    margin-bottom: 20px;
                }
                .button {
                    background-color: #1976D2; /* Azul de Chile */
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-size: 16px;
                    display: inline-block;
                    text-align: center;
                    margin-top: 20px;
                    border: 2px solid #1976D2;
                    width: 100%; /* Asegura que el botón ocupe todo el ancho disponible */
                    box-sizing: border-box; /* Para que el padding no afecte al tamaño del ancho */
                    transition: background-color 0.3s, border-color 0.3s;
                }
                .button:hover {
                    background-color: #1565C0; /* Azul más oscuro */
                    border-color: #1565C0;
                }
                .footer {
                    background-color: #f1f1f1; /* Fondo gris claro */
                    text-align: center;
                    padding: 10px;
                    font-size: 12px;
                    color: #888;
                }
                .footer a {
                    color: #D32F2F; /* Rojo */
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h2>${title}</h2>
                </div>
                <div class="content">
                    <p>Hola,</p>
                    <p>Para continuar con el proceso, por favor haz clic en el siguiente enlace:</p>
                    <a href="${link}" class="button">${linkText}</a>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Bomberos de Osorno. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
    </html>
    `;

};
