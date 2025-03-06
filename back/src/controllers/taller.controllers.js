import { pool } from "../db.js";
import { validateEmail, validateRUT } from "../utils/validations.js";

// Devuelve todos los talleres
export const getTalleres = async (req, res) => {
  try {
    const query = `
      SELECT
        t.id,
        t.tipo_taller_id,
        tt.nombre as tipo_nombre,
        t.razon_social,
        t.rut,
        t.telefono,
        t.contacto,
        t.tel_contacto,
        t.direccion,
        t.correo
      FROM taller t
      LEFT JOIN tipo_taller tt ON t.tipo_taller_id = tt.id
      WHERE t.isDeleted = 0
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
  });
  }
};

// Devuelve todos los talleres con paginación opcional
export const getTalleresPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño por defecto es 10

    //TODO: SE AGREGO ORDER BY t.id DESC PARA QUE SE VEAN DE + NUEVO A + ANTIGUO
    // Si no se proporciona "page", devolver todos los datos sin paginación
    if (!req.query.page) {
      const query = `
        SELECT 
          t.id, 
          t.tipo_taller_id,
          tt.nombre as tipo_nombre,
          t.razon_social,
          t.rut,
          t.telefono,
          t.contacto,
          t.tel_contacto,
          t.direccion,
          t.correo
        FROM taller t
        LEFT JOIN tipo_taller tt ON t.tipo_taller_id = tt.id
        WHERE t.isDeleted = 0
        ORDER BY t.id DESC
      `;
      const [rows] = await pool.query(query);
      return res.json(rows); // Devuelve todos los registros sin paginación
    }

    //TODO: SE AGREGO ORDER BY t.id DESC PARA QUE SE VEAN DE + NUEVO A + ANTIGUO
    // Si se proporciona "page", se aplica paginación
    const offset = (page - 1) * pageSize; // Calcular el offset

    const query = `
      SELECT
        t.id,
        tt.nombre as tipo,
        t.razon_social,
        t.rut,
        t.telefono,
        t.contacto,
        t.tel_contacto,
        t.direccion,
        t.correo
      FROM taller t
      JOIN tipo_taller tt ON t.tipo_taller_id = tt.id 
      WHERE t.isDeleted = 0
      ORDER BY t.id DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await pool.query(query, [pageSize, offset]);
    res.json(rows);
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Devuelve taller por id
export const getTallerById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT t.*, tt.nombre as tipo FROM taller t JOIN tipo_taller tt ON t.tipo_taller_id = tt.id WHERE t.id = ? AND t.isDeleted = 0", [id]);
    if (rows.length <= 0) {
      return res.status(404).json({
        message: "Taller no encontrado",
      });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
  });
  }
};

// Crear nuevo taller
export const createTaller = async (req, res) => {
  let { 
    tipo,
    razon_social,
    rut,
    telefono,
    contacto,
    tel_contacto,
    direccion,
    correo,
    tipo_taller_id
   } = req.body;
  let errors = [];

  try {
    tipo = String(tipo).trim();
    razon_social = String(razon_social).trim();

    // Validaciones de tipo de datos
    if (typeof tipo !== 'string'){
      errors.push('Tipo de datos inválido para "tipo"');
    } 

    if (tipo.length > 50){
      errors.push('El campo "tipo" no puede tener más de 50 caracteres');
    }

    if (typeof razon_social !== 'string'){
      errors.push('Tipo de datos inválido para "razon_social"');
    }

    if (razon_social.length > 45){
      errors.push('El campo "razon_social" no puede tener más de 45 caracteres');
    }

    // Validación campos opcionales
    if (rut !== undefined){
      rut = String(rut).trim();

      if (typeof rut !== 'string'){
        errors.push('Tipo de datos inválido para "rut"');
      }

      if (rut.length > 13){
        errors.push('El campo "rut" no puede tener más de 13 caracteres');
      }

      if (!validateRUT(rut)){
        errors.push('El campo "rut" no es válido');
      }
    }

    if (telefono !== undefined){
      telefono = String(telefono).trim();

      if (typeof telefono !== 'string'){
        errors.push('Tipo de datos inválido para "telefono"');
      }

      if (telefono.length > 15){
        errors.push('El campo "telefono" no puede tener más de 15 caracteres');
      }
    }

    if (contacto !== undefined){
      contacto = String(contacto).trim();

      if (typeof contacto !== 'string'){
        errors.push('Tipo de datos inválido para "contacto"');
      }

      if (contacto.length > 50){
        errors.push('El campo "contacto" no puede tener más de 50 caracteres');
      }
    }

    if (tel_contacto !== undefined){
      tel_contacto = String(tel_contacto).trim();

      if (typeof tel_contacto !== 'string'){
        errors.push('Tipo de datos inválido para "tel_contacto"');
      }

      if (tel_contacto.length > 15){
        errors.push('El campo "tel_contacto" no puede tener más de 15 caracteres');
      }
    }

    if (direccion !== undefined){
      direccion = String(direccion).trim();

      if (typeof direccion !== 'string'){
        errors.push('Tipo de datos inválido para "direccion"');
      }

      if (direccion.length > 100){
        errors.push('El campo "direccion" no puede tener más de 100 caracteres');
      }
    }

    if (correo !== undefined){
      correo = String(correo).trim();

      if (typeof correo !== 'string'){
        errors.push('Tipo de datos inválido para "correo"');
      }

      if (correo.length > 50){
        errors.push('El campo "correo" no puede tener más de 50 caracteres');
      }

      if (!validateEmail(correo)){
        errors.push('El campo "correo" no es válido');
      }
    }

    // Validar que no exista un taller con el mismo razon_social
    const [talleres] = await pool.query("SELECT 1 FROM taller WHERE razon_social = ? AND isDeleted = 0", [razon_social]);
    if (talleres.length > 0) {
      errors.push('Ya existe un taller con el mismo razon_social');
    }

    // Si hay errores de validación, devolverlos
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (tipo_taller_id !== undefined){
      tipo_taller_id = parseInt(tipo_taller_id);
    }

    // Inserción en la base de datos con valores predeterminados o NULL para campos opcionales
    const [rows] = await pool.query(
      `INSERT INTO taller 
      (tipo_taller_id, razon_social, rut, telefono, contacto, tel_contacto, direccion, correo, isDeleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        razon_social, 
        rut || null, 
        telefono || null, 
        contacto || null, 
        tel_contacto || null, 
        direccion || null, 
        correo || null,
        tipo_taller_id
      ]
    );

    res.status(201).json({
      id: rows.insertId,
      tipo_taller_id,
      razon_social,
      rut,
      telefono,
      contacto,
      tel_contacto,
      direccion,
      correo,
    });
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// Dar de baja (marcar como inactivo)
export const deleteTaller = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("UPDATE taller SET isDeleted = 1 WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Taller no encontrado",
      });
    }
    res.status(204).end();
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
  });
  }
};

// Actualizar taller
export const updateTaller = async (req, res) => {
  const { id } = req.params;
  let { 
    tipo_taller_id,
    razon_social,
    rut,
    telefono,
    contacto,
    tel_contacto,
    direccion,
    correo,
    isDeleted
   } = req.body;
  let errors = [];

  try {
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      errors.push("ID inválido");
    }

    if (tipo_taller_id !== undefined){
      tipo_taller_id = parseInt(tipo_taller_id);
    }

    // Validaciones
    const updates = {};

    // Validar campos requeridos y opcionales


    if (razon_social !== undefined) {
      razon_social = String(razon_social).trim();
      if (typeof razon_social !== 'string') {
        errors.push('Tipo de datos inválido para "razon_social"');
      } else if (razon_social.length > 45) {
        errors.push('El campo "razon_social" no puede tener más de 45 caracteres');
      } else {
        updates.razon_social = razon_social;
      }
    }

    if (rut !== undefined) {
      rut = String(rut).trim();
      if (typeof rut !== 'string') {
        errors.push('Tipo de datos inválido para "rut"');
      } else if (rut.length > 13) {
        errors.push('El campo "rut" no puede tener más de 13 caracteres');
      } else if (!validateRUT(rut)) {
        errors.push('El campo "rut" no es válido');
      } else {
        updates.rut = rut;
      }
    }

    if (telefono !== undefined) {
      telefono = String(telefono).trim();
      if (typeof telefono !== 'string') {
        errors.push('Tipo de datos inválido para "telefono"');
      } else if (telefono.length > 15) {
        errors.push('El campo "telefono" no puede tener más de 15 caracteres');
      } else {
        updates.telefono = telefono;
      }
    }

    if (contacto !== undefined) {
      contacto = String(contacto).trim();
      if (typeof contacto !== 'string') {
        errors.push('Tipo de datos inválido para "contacto"');
      } else if (contacto.length > 50) {
        errors.push('El campo "contacto" no puede tener más de 50 caracteres');
      } else {
        updates.contacto = contacto;
      }
    }

    if (tel_contacto !== undefined) {
      tel_contacto = String(tel_contacto).trim();
      if (typeof tel_contacto !== 'string') {
        errors.push('Tipo de datos inválido para "tel_contacto"');
      } else if (tel_contacto.length > 15) {
        errors.push('El campo "tel_contacto" no puede tener más de 15 caracteres');
      } else {
        updates.tel_contacto = tel_contacto;
      }
    }

    if (direccion !== undefined) {
      direccion = String(direccion).trim();
      if (typeof direccion !== 'string') {
        errors.push('Tipo de datos inválido para "direccion"');
      } else if (direccion.length > 100) {
        errors.push('El campo "direccion" no puede tener más de 100 caracteres');
      } else {
        updates.direccion = direccion;
      }
    }

    if (correo !== undefined) {
      correo = String(correo).trim();
      if (typeof correo !== 'string') {
        errors.push('Tipo de datos inválido para "correo"');
      } else if (correo.length > 50) {
        errors.push('El campo "correo" no puede tener más de 50 caracteres');
      } else if (!validateEmail(correo)) {
        errors.push('El campo "correo" no es válido');
      } else {
        updates.correo = correo;
      }
    }

    if (isDeleted !== undefined) {
      if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
        errors.push("Tipo de dato inválido para 'isDeleted'");
      } else {
        updates.isDeleted = isDeleted;
      }
    }

    // Si hay errores, devolverlos
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Si no hay nada que actualizar, devolver un mensaje
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No se proporcionaron campos para actualizar"
      });
    }

    // Construir la consulta de actualización
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(updates).concat(idNumber);
    const [result] = await pool.query(
      `UPDATE taller SET ${setClause} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Taller no encontrado"
      });
    }

    // Obtener el taller actualizado
    const [rows] = await pool.query("SELECT * FROM taller WHERE id = ?", [idNumber]);
    res.json(rows[0]);
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};


export const getTiposTaller = async (req, res) => {
  try {
    const query = "SELECT id, nombre FROM tipo_taller WHERE isDeleted = 0";
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

