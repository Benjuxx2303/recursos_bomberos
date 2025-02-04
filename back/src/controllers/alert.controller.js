// ==================================================
// Enviar notificación por correo
// ==================================================
try {
    
    // Generar el contenido HTML del correo usando una plantilla
    const htmlContent = generateEmailTemplate(
        'Nueva Notificación', // Título del correo
        contenido,            // Contenido de la notificación
        `${process.env.FRONTEND_URL}/combustible`, // Enlace para más detalles
        'Ver Detalles'        // Texto del botón
    );

    // Paso 2: Obtener el correo del usuario desde la base de datos
    const [userEmail] = await pool.query(
        'SELECT u.correo FROM usuario u WHERE u.id = ? AND u.isDeleted = 0',
        [userId] // ID del usuario al que se enviará el correo
    );

    // Paso 3: Verificar si el usuario tiene un correo registrado
    if (userEmail.length > 0 && userEmail[0].correo) {
        // Si el usuario tiene un correo, enviar la notificación
        await sendEmail(
            userEmail[0].correo,       // Correo del destinatario
            `Nueva notificación: ${tipo}`, // Asunto del correo
            contenido,                 // Contenido en texto plano
            htmlContent                // Contenido en HTML
        );
    } else {

    }
} catch (emailError) {
}