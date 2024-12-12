import nodemailer from 'nodemailer';
import { 
    GMAIL_USER, 
    GMAIL_PASS 
} from '../config.js';

// Crear el transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Usamos Gmail como servicio de correo
    auth: {
        user: GMAIL_USER,  // Debes agregar este valor en tu .env
        pass: GMAIL_PASS  // Usa una contraseña de aplicación para Gmail
    }
});

// Función para enviar correos
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
