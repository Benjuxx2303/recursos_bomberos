import { pool } from "../db.js";
import { generateEmailTemplate, sendEmail } from "./mailer.js";
import { emitNotification } from "./websocket.js";

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
  console.log("getNotificationUsers filters:", filters); // Log para depuración
  let query = `
    SELECT DISTINCT u.id, u.username, u.correo, rp.nombre as rol, p.id as personal_id, p.compania_id, c.nombre as compania_nombre
    FROM usuario u
    INNER JOIN personal p ON u.personal_id = p.id
    INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
    LEFT JOIN compania c ON p.compania_id = c.id
    WHERE u.isDeleted = 0
  `;

  const queryParams = [];

  if (filters.rol) {
    query += " AND rp.nombre = ?\n";
    queryParams.push(filters.rol);
  }

  if (filters.compania_id) {
    query += " AND p.compania_id = ?\n";
    queryParams.push(filters.compania_id);
  }

  if (filters.cargos_importantes) {
    query += "AND rp.nombre IN ('TELECOM', 'Comandante', 'Inspector Material Mayor')";
    queryParams.push(filters.cargos_importantes);
  }

  if (filters.personal_id) {
    query += "AND p.id = ?";
    queryParams.push(filters.personal_id);
  }

  const [usuarios] = await pool.query(query, queryParams);
  return usuarios;
};

/**
 * Obtiene los talleres que deben recibir notificaciones según los criterios especificados
 * @param {Object} filters - Filtros para seleccionar talleres
 * @param {string} filters.tipo - Tipo específico de taller (opcional)
 * @param {string} filters.razon_social - Razón social del taller (opcional)
 * @param {boolean} filters.isDeleted - Estado de eliminación del taller (opcional)
 * @param {string} filters.nombre - Nombre del taller (opcional)
 * @param {number} filters.id - ID del taller (opcional)
 * @returns {Promise<Array>} Lista de talleres que recibirán notificaciones
 * @example
 * // Obtener talleres del tipo 'Mecánico'
 * const talleres = await getNotificationTalleres({ tipo: 'Mecánico' });
 */
export const getNotificationTalleres = async (filters = {}) => {
  let query = `
    SELECT id, nombre, razon_social, correo, telefono, contacto, tel_contacto, descripcion, direccion
    FROM taller
    WHERE isDeleted = 0
  `;

  const queryParams = [];

  if (filters.tipo) {
    query += " AND tipo = ?";
    queryParams.push(filters.tipo);
  }

  if (filters.razon_social) {
    query += " AND razon_social = ?";
    queryParams.push(filters.razon_social);
  }

  if (filters.isDeleted !== undefined) {
    query += " AND isDeleted = ?";
    queryParams.push(filters.isDeleted);
  }

  if (filters.nombre) {
    query += " AND nombre = ?";
    queryParams.push(filters.nombre);
  }

  if (filters.id) {
    query += " AND id = ?";
    queryParams.push(filters.id);
  }

  const [talleres] = await pool.query(query, queryParams);
  return talleres;
};

// Definición de roles para la lógica de notificación
const ROLES_GLOBALES = ["Comandante", "TELECOM", "Inspector Material Mayor", "Centrista"];
const ROLES_POR_COMPANIA = ["Capitan", "Teniente de Máquina"];
const ROLES_INDIVIDUALES_ESTRICTOS = ["Maquinista", "Conductor Rentado"];

/**
 * Crea una alerta en la base de datos, la asocia con los destinatarios pertinentes y envía notificaciones
 * por correo electrónico y WebSocket según la lógica de roles y el tipo de evento.
 *
 * @param {Object} params - Parámetros para la creación y envío de notificaciones.
 * @param {string} params.contenido - Contenido principal de la alerta.
 * @param {string} params.tipo - Tipo general de la alerta (ej. 'vencimiento_licencia', 'mantencion_creada').
 * @param {string|null} params.idLink - ID o URL relacionada con el evento para la alerta.
 * @param {Array<Object>} params.destinatarios - Lista de objetos usuario potenciales.
 * @param {Object} params.emailConfig - Configuración para el correo (subject, redirectUrl, buttonText, attachments).
 * @param {Object} params.evento - Objeto que describe el evento que dispara la notificación.
 * @returns {Promise<number|null>} ID de la alerta creada, o null si no se creó ninguna.
 */
export const createAndSendNotifications = async ({
  contenido,
  tipo,
  idLink = null,
  destinatarios,
  emailConfig,
  evento
}) => {
  console.log("\n=== Iniciando proceso de notificaciones ===");
  console.log("Tipo de alerta:", tipo);
  console.log("Contenido:", contenido);
  console.log("Destinatarios potenciales:", destinatarios.length);
  console.log("Evento:", JSON.stringify(evento));
  console.log("EmailConfig:", JSON.stringify(emailConfig));

  if (!destinatarios || destinatarios.length === 0) {
    console.log("No hay destinatarios potenciales, terminando proceso.");
    return null;
  }

  if (!evento || !evento.tipo_evento) {
    console.error("Error: El objeto evento y evento.tipo_evento son requeridos para la lógica de roles.");
    return null;
  }

  let alertaId;
  try {
    const [alertaResult] = await pool.query(
      "INSERT INTO alerta (contenido, tipo, idLink, createdAt, isRead) VALUES (?, ?, ?, NOW(), false)",
      [contenido, tipo, idLink]
    );
    alertaId = alertaResult.insertId;
    console.log("Alerta general creada con ID:", alertaId);
  } catch (error) {
    console.error("Error al crear la alerta en la BD:", error);
    throw error;
  }

  const notifiedDestinatariosMail = new Set();

  const notificationPromises = destinatarios.map(async (destinatario) => {
    if (!destinatario || !destinatario.rol || !destinatario.id) {
      console.warn("Destinatario inválido o incompleto, omitiendo:", destinatario);
      return;
    }

    let debeRecibirNotificacion = false;
    let motivoDecision = "";

    if (ROLES_INDIVIDUALES_ESTRICTOS.includes(destinatario.rol)) {
      if (evento.tipo_evento === "vencimiento_licencia_conductor" && evento.personal_id_afectado === destinatario.personal_id) {
        debeRecibirNotificacion = true;
        motivoDecision = `Rol individual (${destinatario.rol}): Vencimiento de su propia licencia.`;
      } else if (evento.tipo_evento === "mantencion_creada" && evento.ingresado_por_usuario_id === destinatario.id) {
        debeRecibirNotificacion = true;
        motivoDecision = `Rol individual (${destinatario.rol}): Mantención ingresada por él/ella.`;
      } else {
        motivoDecision = `Rol individual (${destinatario.rol}): Evento no aplica (Tipo: ${evento.tipo_evento}).`;
      }
    } else if (ROLES_GLOBALES.includes(destinatario.rol)) {
      debeRecibirNotificacion = true;
      motivoDecision = `Rol global (${destinatario.rol}).`;
    } else if (ROLES_POR_COMPANIA.includes(destinatario.rol)) {
      if (evento.compania_id && destinatario.compania_id === evento.compania_id) {
        debeRecibirNotificacion = true;
        motivoDecision = `Rol por compañía (${destinatario.rol}): Coincide compañía (Usuario: ${destinatario.compania_id}, Evento: ${evento.compania_id}).`;
      } else {
        motivoDecision = `Rol por compañía (${destinatario.rol}): NO coincide compañía o evento sin compañía (Usuario Cia: ${destinatario.compania_id}, Evento Cia: ${evento.compania_id}).`;
      }
    } else {
      motivoDecision = `Rol ${destinatario.rol} no cubierto por reglas específicas para este tipo de alerta.`;
    }

    console.log(`  Procesando para ${destinatario.correo} (Rol: ${destinatario.rol}, UsuarioID: ${destinatario.id}, PersonalID: ${destinatario.personal_id}, CiaUsuario: ${destinatario.compania_id}):`);
    console.log(`    Decisión: ${debeRecibirNotificacion ? "RECIBE" : "NO RECIBE"}. Motivo: ${motivoDecision}`);

    if (debeRecibirNotificacion) {
      try {
        await pool.query(
          "INSERT INTO usuario_alerta (usuario_id, alerta_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE alerta_id = ?",
          [destinatario.id, alertaId, alertaId]
        );
      } catch (dbError) {
        console.error(`Error al crear relación usuario_alerta para ${destinatario.id} y alerta ${alertaId}:`, dbError);
      }

      if (destinatario.correo && !notifiedDestinatariosMail.has(destinatario.correo)) {
        try {
          const htmlContent = generateEmailTemplate(
            emailConfig.subject,
            contenido,
            emailConfig.redirectUrl || "",
            emailConfig.buttonText || "Ver Detalles"
          );
          const attachments = emailConfig.attachments || [];
          
          console.log(`    Enviando correo a ${destinatario.correo}...`);
          await sendEmail(
            destinatario.correo,
            emailConfig.subject,
            contenido,
            htmlContent,
            attachments
          );
          notifiedDestinatariosMail.add(destinatario.correo);
        } catch (emailError) {
          console.error(`    Error al enviar correo a ${destinatario.correo}:`, emailError.message);
        }
      }

      try {
        const alertaDataForSocket = {
          id: alertaId,
          contenido,
          tipo,
          idLink,
          createdAt: new Date().toISOString(),
          isRead: false
        };
        await emitNotification(destinatario.id, alertaDataForSocket);
      } catch (wsError) {
        console.error(`    Error al emitir notificación WebSocket a usuario ${destinatario.id}:`, wsError.message);
      }
    }
  });

  try {
    await Promise.allSettled(notificationPromises);
  } catch (settledError) {
    console.error("Error durante Promise.allSettled:", settledError);
  }

  console.log("=== Proceso de notificaciones (createAndSendNotifications) completado para alerta ID:", alertaId, " ===");
  return alertaId;
};

export const saveAndEmitAlert = async (usuarioId, contenido, tipo = "general", idLink = null) => {
  try {
    if (!usuarioId || !contenido) {
      throw new Error("usuario_id y contenido son requeridos");
    }

    const [userInfo] = await pool.query(
      `SELECT u.id, u.username, u.correo, rp.nombre as rol
       FROM usuario u
       INNER JOIN personal p ON u.personal_id = p.id
       INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
       WHERE u.id = ? AND u.isDeleted = 0`,
      [usuarioId]
    );

    if (userInfo.length === 0) {
      console.log(`Usuario no encontrado o inactivo: ${usuarioId}. No se creará la alerta.`);
      return null;
    }

    const [existingAlert] = await pool.query(
      "SELECT id, idLink FROM alerta WHERE contenido LIKE ? AND tipo = ? LIMIT 1",
      [`%${contenido}%`, tipo]
    );

    let alertaId;
    let alertaIdLink;

    if (existingAlert.length > 0) {
      alertaId = existingAlert[0].id;
      alertaIdLink = existingAlert[0].idLink;
      console.log(`❗❗Alerta duplicada encontrada. Usando alerta existente con ID: ${alertaId}`);
    } else {
      const [result] = await pool.query(
        "INSERT INTO alerta (contenido, tipo, idLink, createdAt, isRead) VALUES (?, ?, ?, NOW(), false)",
        [contenido, tipo, idLink]
      );
      alertaId = result.insertId;
      alertaIdLink = idLink;
      console.log(`❗Alerta con ID "${alertaId}" creada para usuario "${usuarioId}": ${contenido}`);
    }

    const [existingRelation] = await pool.query(
      "SELECT 1 FROM usuario_alerta WHERE usuario_id = ? AND alerta_id = ? LIMIT 1",
      [usuarioId, alertaId]
    );

    if (existingRelation.length > 0) {
      console.log("🛑Relación usuario_alerta ya existe. No se insertará.");
    } else {
      await pool.query(
        "INSERT INTO usuario_alerta (usuario_id, alerta_id) VALUES (?, ?)",
        [usuarioId, alertaId]
      );
      console.log(`✅Relación usuario_alerta creada entre el usuario ${usuarioId} y la alerta ${alertaId}.`);
    }

    const alertaData = {
      id: alertaId,
      usuario_id: usuarioId,
      contenido,
      tipo,
      idLink: alertaIdLink,
      createdAt: new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" }),
      isRead: false
    };

    await emitNotification(usuarioId, alertaData);
    
    return alertaData;
  } catch (error) {
    console.error("Error al guardar la alerta:", error);
    throw error;
  }
};