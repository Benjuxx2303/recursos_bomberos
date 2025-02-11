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
    },
    tls: {
        rejectUnauthorized: false
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
    // console.log('\n=== Iniciando envío de correo ===');
    // console.log('Destinatario:', to);
    // console.log('Asunto:', subject);
    
    // Verificar si ya se envió un correo similar en los últimos segundos
    if (global.lastEmailSent && global.lastEmailSent[to]) {
        const timeDiff = Date.now() - global.lastEmailSent[to].timestamp;
        if (timeDiff < 5000 && global.lastEmailSent[to].subject === subject) {
            // console.log('Evitando envío duplicado de correo');
            return null;
        }
    }
    
    try {
        // Crear el transporter
        // console.log('Configurando transporter...');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // console.log('Verificando configuración del transporter...');
        await transporter.verify();
        // console.log('Transporter verificado exitosamente');

        // Configurar el correo
        const mailOptions = {
            from: `"Cuerpo de Bomberos de Osorno" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };

        // console.log('Enviando correo...');
        const info = await transporter.sendMail(mailOptions);
        
        // Registrar este envío
        if (!global.lastEmailSent) global.lastEmailSent = {};
        global.lastEmailSent[to] = {
            timestamp: Date.now(),
            subject: subject
        };
        
        // console.log('Correo enviado exitosamente');
        // console.log('ID del mensaje:', info.messageId);
        
        return info;
    } catch (error) {
        console.error('Error al enviar correo:');
        console.error('Tipo de error:', error.name);
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    }
};


/**
 * Generates an HTML email template.
 *
 * @param {string} title - The title of the email.
 * @param {string} content - The main content of the email.
 * @param {string} actionUrl - The URL for the action button.
 * @param {string} actionText - The text for the action button.
 * @returns {string} The generated HTML email template.
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
