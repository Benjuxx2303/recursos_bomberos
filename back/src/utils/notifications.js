import { pool } from "../db.js";
import { generateEmailTemplate, sendEmail } from './mailer.js';
import { emitNotification } from './websocket.js';

/**
 * Sistema de Notificaciones y Alertas
 * 
 * Este módulo maneja todas las funcionalidades relacionadas con notificaciones y alertas:
 * - Obtención de usuarios según filtros (rol, compañía)
 * - Creación y envío de notificaciones masivas
 * - Envío de notificaciones individuales
 * - Soporte para notificaciones por WebSocket y correo electrónico
 * 
 * Tipos de notificaciones soportadas:
 * - combustible: Notificaciones de cargas de combustible
 * - mantencion: Notificaciones de mantenciones
 * - general: Notificaciones generales del sistema
 * 
 * @module notifications
 */

/**
 * Obtiene los usuarios que deben recibir notificaciones según los criterios especificados
 * @param {Object} filters - Filtros para seleccionar usuarios
 * @param {string} filters.rol - Rol específico de usuarios (opcional)
 * @param {number} filters.compania_id - ID de la compañía (opcional)
 * @returns {Promise<Array>} Lista de usuarios que recibirán notificaciones
 * @example
 * // Obtener usuarios del rol TELECOM
 * const usuarios = await getNotificationUsers({ rol: 'TELECOM' });
 * 
 * // Obtener usuarios de una compañía específica
 * const usuarios = await getNotificationUsers({ compania_id: 1 });
 */
export const getNotificationUsers = async (filters = {}) => {
    let query = `
        SELECT DISTINCT u.id, u.username, u.correo, rp.nombre as rol, c.nombre as compania_nombre
        FROM usuario u
        INNER JOIN personal p ON u.personal_id = p.id
        INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
        LEFT JOIN compania c ON p.compania_id = c.id
        WHERE u.isDeleted = 0
    `;

    const queryParams = [];

    if (filters.rol) {
        query += ' AND rp.nombre = ?';
        queryParams.push(filters.rol);
    }

    if (filters.compania_id) {
        query += ' AND p.compania_id = ?';
        queryParams.push(filters.compania_id);
    }

    const [usuarios] = await pool.query(query, queryParams);
    return usuarios;
};

/**
 * Crea y envía una notificación individual a un usuario específico
 * Esta función es útil para notificaciones personalizadas o eventos específicos de un usuario
 * 
 * @param {number} userId - ID del usuario que recibirá la notificación
 * @param {string} contenido - Contenido de la notificación
 * @param {string} [tipo='general'] - Tipo de notificación
 * @returns {Promise<Object>} Objeto con la información de la alerta creada
 * @throws {Error} Si el usuario no existe o hay problemas al crear la alerta
 * @example
 * // Enviar una notificación general a un usuario
 * await saveAndEmitAlert(1, 'Tu solicitud ha sido aprobada');
 * 
 * // Enviar una notificación de un tipo específico
 * await saveAndEmitAlert(1, 'Nueva mantención asignada', 'mantencion');
 */
/**
 * Guarda la alerta en la base de datos y la emite en tiempo real.
 */
export const saveAndEmitAlert = async (usuario_id, contenido, tipo = 'general') => {
    try {
        if (!usuario_id || !contenido) {
            throw new Error('usuario_id y contenido son requeridos');
        }

        // Verificar que el usuario existe y obtener su información
        const [userInfo] = await pool.query(
            `SELECT u.id, u.username, u.correo, rp.nombre as rol
             FROM usuario u
             INNER JOIN personal p ON u.personal_id = p.id
             INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
             WHERE u.id = ? AND u.isDeleted = 0`,
            [usuario_id]
        );

        if (userInfo.length === 0) {
            throw new Error(`Usuario no encontrado o inactivo: ${usuario_id}`);
        }

        // Verificar si ya existe una alerta con un contenido similar
        const [existingAlert] = await pool.query(
            'SELECT id FROM alerta WHERE contenido LIKE ? LIMIT 1',
            [`%${contenido}%`] // Busca si hay alertas con contenido similar
        );

        // Si existe una alerta similar, omitir la inserción
        if (existingAlert.length > 0) {
            console.log(`Alerta duplicada encontrada. No se insertará.`);
            return null; // No se crea la alerta
        }

        // Crear la alerta sin relacionar directamente con usuario_id
        const [result] = await pool.query(
            'INSERT INTO alerta (contenido, tipo, createdAt, isRead) VALUES (?, ?, NOW(), false)',
            [contenido, tipo]
        );

        // Crear relación usuario-alerta
        await pool.query(
            'INSERT INTO usuario_alerta (usuario_id, alerta_id) VALUES (?, ?)',
            [usuario_id, result.insertId]
        );

        const alertaData = {
            id: result.insertId,
            usuario_id,
            contenido,
            tipo,
            createdAt: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
            isRead: false
        };

        // Enviar notificación WebSocket
        await emitNotification(usuario_id, alertaData);
        
        return alertaData;
    } catch (error) {
        console.error("Error al guardar la alerta:", error);
        throw error;
    }
};

/**
 * Crea y envía notificaciones a múltiples usuarios
 * Esta función es útil para notificaciones masivas o eventos que afectan a múltiples usuarios
 * 
 * @param {Object} params - Parámetros para la notificación
 * @param {string} params.contenido - Contenido de la notificación
 * @param {string} params.tipo - Tipo de notificación (ej: 'combustible', 'mantencion')
 * @param {Array} params.usuarios - Lista de usuarios que recibirán la notificación
 * @param {Object} params.emailConfig - Configuración del email
 * @param {string} params.emailConfig.subject - Asunto del correo
 * @param {string} params.emailConfig.redirectUrl - URL para el botón del correo
 * @param {string} params.emailConfig.buttonText - Texto del botón del correo
 * @returns {Promise<number>} ID de la alerta creada
 * @example
 * // Enviar notificación masiva
 * await createAndSendNotifications({
 *     contenido: 'Nueva actualización del sistema',
 *     tipo: 'sistema',
 *     usuarios: usuariosList,
 *     emailConfig: {
 *         subject: 'Actualización Importante',
 *         redirectUrl: 'http://ejemplo.com/actualizacion',
 *         buttonText: 'Ver Detalles'
 *     }
 * });
 */
export const createAndSendNotifications = async ({ contenido, tipo, usuarios, emailConfig }) => {
    console.log('\n=== Iniciando proceso de notificaciones ===');
    console.log('Tipo:', tipo);
    console.log('Usuarios a notificar:', usuarios.length);

    try {
        // Crear una única alerta
        const [alertaResult] = await pool.query(
            'INSERT INTO alerta (contenido, tipo, createdAt, isRead) VALUES (?, ?, NOW(), false)',
            [contenido, tipo]
        );
        
        const alertaId = alertaResult.insertId;
        console.log('Alerta creada con ID:', alertaId);

        // Crear un Set para rastrear usuarios ya notificados
        const notifiedUsers = new Set();

        // Procesar cada usuario
        const notificationPromises = usuarios.map(async (usuario) => {
            try {
                // Evitar duplicados
                if (notifiedUsers.has(usuario.id)) {
                    console.log(`Usuario ${usuario.username} ya fue notificado, omitiendo...`);
                    return;
                }

                notifiedUsers.add(usuario.id);
                console.log(`\n=== Procesando notificaciones para usuario: ${usuario.username} ===`);
                
                // Crear relación usuario-alerta
                await pool.query(
                    'INSERT INTO usuario_alerta (usuario_id, alerta_id) VALUES (?, ?)',
                    [usuario.id, alertaId]
                );

                // Enviar correo si el usuario tiene email
                if (usuario.correo) {
                    try {
                        const htmlContent = generateEmailTemplate(
                            emailConfig.subject,
                            contenido,
                            emailConfig.redirectUrl,
                            emailConfig.buttonText
                        );
                        
                        // Si hay archivos adjuntos, deben ser enviados como un array
                        const attachments = emailConfig.attachments || [];

                        await sendEmail(
                            usuario.correo,
                            emailConfig.subject,
                            contenido,
                            htmlContent,
                            attachments
                        );
                    } catch (emailError) {
                        console.error(`Error al enviar correo a ${usuario.correo}:`, emailError.message);
                    }
                }

                // Enviar notificación WebSocket
                try {
                    const alertaData = {
                        id: alertaId,
                        contenido,
                        tipo,
                        createdAt: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
                        isRead: false
                    };
                    
                    await emitNotification(usuario.id, alertaData);
                } catch (wsError) {
                    console.error(`Error al emitir notificación WebSocket a ${usuario.username}:`, wsError.message);
                }
            } catch (userError) {
                console.error(`Error procesando notificaciones para usuario ${usuario.username}:`, userError.message);
            }
        });

        // Esperar a que todas las notificaciones se procesen
        await Promise.allSettled(notificationPromises);
        console.log('=== Proceso de notificaciones completado ===');

        return alertaId;
    } catch (error) {
        console.error('Error en createAndSendNotifications:', error);
        throw error;
    }
};