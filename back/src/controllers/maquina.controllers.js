import { pool } from "../db.js";
import { format } from 'date-fns';
import {
  uploadFileToS3,
  updateImageUrlInDb,
  handleError
} from '../utils/fileUpload.js';
import { validateType } from '../utils/validations.js';
import e from "express";

// Obtener todas las máquinas
export const getMaquinas = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM maquina WHERE isDeleted = 0");
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// Obtener detalles de las máquinas
export const getMaquinasDetails = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        m.id AS maquina_id,
        m.disponible AS disponible,
        m.codigo AS codigo,
        m.patente AS patente,
        m.num_chasis AS num_chasis,
        m.vin AS vin,
        m.bomba AS bomba,
        m.hmetro_bomba AS hmetro_bomba,
        m.hmetro_motor AS hmetro_motor,
        m.kmetraje AS kmetraje,
        m.num_motor AS num_motor,
        m.peso_kg AS peso_kg,
        DATE_FORMAT(m.ven_patente, '%d-%m-%Y') AS ven_patente,
        m.cost_rev_tec AS cost_rev_tec,
        DATE_FORMAT(m.ven_rev_tec, '%d-%m-%Y') AS ven_rev_tec,
        m.cost_seg_auto AS cost_seg_auto,
        DATE_FORMAT(m.ven_seg_auto, '%d-%m-%Y') AS ven_seg_auto,
        tm.nombre AS tipo_maquina,
        c.id AS compania_id,
        c.nombre AS compania,
        p.nombre AS procedencia,
        m.img_url AS img_url
      FROM maquina m
      INNER JOIN tipo_maquina tm ON m.tipo_maquina_id = tm.id
      INNER JOIN compania c ON m.compania_id = c.id
      INNER JOIN procedencia p ON m.procedencia_id = p.id
      WHERE m.isDeleted = 0
    `);
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// Obtener detalles de las máquinas con paginación
export const getMaquinasDetailsPage = async (req, res) => {
  try {
    // Obtener los parámetros opcionales
    const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
    const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

    // Si no se proporciona "page", devolver todos los datos sin paginación
    if (!req.query.page) {
      const query = `
        SELECT
          m.*,
          tm.nombre AS tipo_maquina,
          c.id AS compania_id,
          c.nombre AS compania,
          p.nombre AS procedencia,
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', per.id,
                'nombre', CONCAT(per.nombre, ' ', per.apellido)
              )
            )
            FROM conductor_maquina cm
            JOIN personal per ON cm.personal_id = per.id
            WHERE cm.maquina_id = m.id AND cm.isDeleted = 0 AND per.isDeleted = 0
          ) as conductores
        FROM maquina m
        INNER JOIN tipo_maquina tm ON m.tipo_maquina_id = tm.id
        INNER JOIN compania c ON m.compania_id = c.id
        INNER JOIN procedencia p ON m.procedencia_id = p.id
        WHERE m.isDeleted = 0
      `;
      const [rows] = await pool.query(query);
      // return res.json(rows); // Devuelve todos los registros sin paginación
      // Formatear fechas y procesar conductores
      const formattedRows = rows.map(row => ({
        ...row,
        ven_patente: row.ven_patente ? format(new Date(row.ven_patente), 'dd-MM-yyyy') : null,
        ven_rev_tec: row.ven_rev_tec ? format(new Date(row.ven_rev_tec), 'dd-MM-yyyy') : null,
        ven_seg_auto: row.ven_seg_auto ? format(new Date(row.ven_seg_auto), 'dd-MM-yyyy') : null,
        conductores: row.conductores ? JSON.parse(row.conductores) : []
      }));
      
      return res.json(formattedRows);
    }

    // Si se proporciona "page", se aplica paginación
    const offset = (page - 1) * pageSize; // Calcular el offset

    const query = `
      SELECT
        m.*,
        tm.nombre AS tipo_maquina,
        c.id AS compania_id,
        c.nombre AS compania,
        p.nombre AS procedencia,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', per.id,
              'nombre', CONCAT(per.nombre, ' ', per.apellido)
            )
          )
          FROM conductor_maquina cm
          JOIN personal per ON cm.personal_id = per.id
          WHERE cm.maquina_id = m.id AND cm.isDeleted = 0 AND per.isDeleted = 0
        ) as conductores
      FROM maquina m
      INNER JOIN tipo_maquina tm ON m.tipo_maquina_id = tm.id
      INNER JOIN compania c ON m.compania_id = c.id
      INNER JOIN procedencia p ON m.procedencia_id = p.id
      WHERE m.isDeleted = 0
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await pool.query(query, [pageSize, offset]);
    // res.json(rows);
    // Formatear fechas y procesar conductores
    const formattedRows = rows.map(row => ({
      ...row,
      ven_patente: row.ven_patente ? format(row.ven_patente, 'dd-MM-yyyy') : null,
      ven_rev_tec: row.ven_rev_tec ? format(row.ven_rev_tec, 'dd-MM-yyyy') : null,
      ven_seg_auto: row.ven_seg_auto ? format(row.ven_seg_auto, 'dd-MM-yyyy') : null,
      conductores: row.conductores ? JSON.parse(row.conductores) : []
    }));
    
    res.json(formattedRows);
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Obtener máquina por ID
export const getMaquinaById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT
        m.id AS maquina_id,
        m.disponible AS disponible,
        m.codigo AS codigo,
        m.patente AS patente,
        m.num_chasis AS num_chasis,
        m.vin AS vin,
        m.bomba AS bomba,
        m.hmetro_bomba AS hmetro_bomba,
        m.hmetro_motor AS hmetro_motor,
        m.kmetraje AS kmetraje,
        m.num_motor AS num_motor,
        DATE_FORMAT(m.ven_patente, '%d-%m-%Y') AS ven_patente,
        m.cost_rev_tec AS cost_rev_tec,
        DATE_FORMAT(m.ven_rev_tec, '%d-%m-%Y') AS ven_rev_tec,
        m.cost_seg_auto AS cost_seg_auto,
        DATE_FORMAT(m.ven_seg_auto, '%d-%m-%Y') AS ven_seg_auto,
        m.peso_kg AS peso_kg,
        tm.nombre AS tipo_maquina,
        c.id AS compania_id,
        c.nombre AS compania,
        p.nombre AS procedencia,
        m.img_url AS img_url
      FROM maquina m
      INNER JOIN tipo_maquina tm ON m.tipo_maquina_id = tm.id
      INNER JOIN compania c ON m.compania_id = c.id
      INNER JOIN procedencia p ON m.procedencia_id = p.id
      WHERE m.id = ? AND m.isDeleted = 0
    `, [id]);
    
    if (rows.length <= 0) return res.status(404).json({ message: "Máquina no encontrada" });
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// Crear nueva máquina
export const createMaquina = async (req, res) => {
  let {
    tipo_maquina_id,
    compania_id,
    codigo,
    patente,
    num_chasis,
    vin,
    bomba,
    hmetro_bomba,
    hmetro_motor,
    kmetraje,
    num_motor,
    ven_patente,
    procedencia_id,
    cost_rev_tec,
    ven_rev_tec,
    cost_seg_auto,
    ven_seg_auto,
    peso_kg,
  } = req.body;

  const errors = []; // Arreglo para almacenar errores

  try {
    // Validaciones de tipo de datos
    if (isNaN(parseInt(tipo_maquina_id))) {
      errors.push({ field: 'tipo_maquina_id', message: 'El campo "tipo_maquina_id" debe ser un número entero.' });
    }
    if (isNaN(parseInt(compania_id))) {
      errors.push({ field: 'compania_id', message: 'El campo "compania_id" debe ser un número entero.' });
    }
    if (typeof codigo !== 'string') {
      errors.push({ field: 'codigo', message: 'El campo "codigo" debe ser una cadena de texto.' });
    }
    if (typeof patente !== 'string') {
      errors.push({ field: 'patente', message: 'El campo "patente" debe ser una cadena de texto.' });
    }
    if (typeof num_chasis !== 'string') {
      errors.push({ field: 'num_chasis', message: 'El campo "num_chasis" debe ser una cadena de texto.' });
    }
    if (typeof vin !== 'string') {
      errors.push({ field: 'vin', message: 'El campo "vin" debe ser una cadena de texto.' });
    }
    if (isNaN(parseFloat(cost_rev_tec))) {
      errors.push({ field: 'cost_rev_tec', message: 'El campo "cost_rev_tec" debe ser un número decimal.' });
    }
    if (isNaN(parseFloat(cost_seg_auto))) {
      errors.push({ field: 'cost_seg_auto', message: 'El campo "cost_seg_auto" debe ser un número decimal.' });
    }
    if (isNaN(parseInt(peso_kg))) {
      errors.push({ field: 'peso_kg', message: 'El campo "peso_kg" debe ser un número entero.' });
    }

    // manejar la carga de archivos si existen
    let img_url = null;

    // manejo de subida de imagen S3
    if (req.files) {
      const imagen = req.files.imagen ? req.files.imagen[0] : null;

      if (imagen) {
        try {
          const imgData = await uploadFileToS3(imagen, "maquina");
          if (imgData && imgData.Location) {
            img_url = imgData.Location;
          } else {
            errors.push('No se pudo obtener la URL de la imagen');
          }
        } catch (error) {
          errors.push('Error al subir la imagen', error.message);
        }
      }
    }
    
    // Validación de llaves foráneas
    const [tipoMaquina] = await pool.query("SELECT * FROM tipo_maquina WHERE id = ? AND isDeleted = 0", [tipo_maquina_id]);
    if (tipoMaquina.length === 0) {
      errors.push({ field: 'tipo_maquina_id', message: 'El tipo de máquina con el ID proporcionado no existe o está eliminado.' });
    }
    
    const [compania] = await pool.query("SELECT * FROM compania WHERE id = ? AND isDeleted = 0", [compania_id]);
    if (compania.length === 0) {
      errors.push({ field: 'compania_id', message: 'La compañía con el ID proporcionado no existe o está eliminada.' });
    }
    
    const [procedencia] = await pool.query("SELECT * FROM procedencia WHERE id = ? AND isDeleted = 0", [procedencia_id]);
    if (procedencia.length === 0) {
      errors.push({ field: 'procedencia_id', message: 'La procedencia con el ID proporcionado no existe o está eliminada.' });
    }
    
    // Validación de fechas
    const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    const fechas = [
      { field: 'ven_patente', value: ven_patente },
      { field: 'ven_rev_tec', value: ven_rev_tec },
      { field: 'ven_seg_auto', value: ven_seg_auto }
    ];
    
    for (const { field, value } of fechas) {
      if (value && !fechaRegex.test(value)) {
        errors.push({ field, message: `El formato de fecha en el campo ${field} es inválido. Debe ser dd-mm-aaaa.` });
      }
    }
    
    const [patenteExists] = await pool.query("SELECT * FROM maquina WHERE patente = ? AND isDeleted = 0", [patente]);
    if (patenteExists.length > 0) {
      errors.push({ field: 'patente', message: 'Ya existe una máquina con la patente proporcionada.' });
    }
    
    // Si hay errores, devolverlos antes de continuar
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Inserción en la base de datos
    const [rows] = await pool.query(
      "INSERT INTO maquina (tipo_maquina_id, compania_id, codigo, patente, num_chasis, vin, bomba, hmetro_bomba, hmetro_motor, kmetraje, num_motor, ven_patente, procedencia_id, cost_rev_tec, ven_rev_tec, cost_seg_auto, ven_seg_auto, isDeleted, peso_kg, img_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, STR_TO_DATE(?, '%d-%m-%Y'), 0, ?, ?)",
      [
        tipo_maquina_id,
        compania_id,
        codigo,
        patente,
        num_chasis,
        vin,
        bomba,
        hmetro_bomba,
        hmetro_motor,
        kmetraje,
        num_motor,
        ven_patente,
        procedencia_id,
        cost_rev_tec,
        ven_rev_tec,
        cost_seg_auto,
        ven_seg_auto,
        peso_kg,
        img_url
      ]
    );

    res.status(201).json({ id: rows.insertId, ...req.body });
  } catch (error) {
    errors.push({ message: "Error interno del servidor", error: error.message });
    return res.status(500).json({ errors });
  }
};

// Eliminar máquina (cambiar estado)
export const deleteMaquina = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("UPDATE maquina SET isDeleted = 1 AND disponible = 0 WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Máquina no encontrada" });
    res.status(204).end();
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// Actualizar máquina
export const updateMaquina = async (req, res) => {
  const { id } = req.params;
  let {
    tipo_maquina_id,
    compania_id,
    codigo,
    patente,
    num_chasis,
    vin,
    bomba,
    hmetro_bomba,
    hmetro_motor,
    kmetraje,
    num_motor,
    ven_patente,
    procedencia_id,
    cost_rev_tec,
    ven_rev_tec,
    cost_seg_auto,
    ven_seg_auto,
    disponible,
    peso_kg,
    isDeleted,
  } = req.body;

  const errors = [];

  try {
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      errors.push("ID inválido");
      return res.status(400).json({ message: "ID inválido", errors });
    }

    // Validaciones
    const updates = {};

    // manejar la carga de archivos si existen
    let img_url = null;

    // manejo de subida de imagen S3
    if (req.files) {
      const imagen = req.files.imagen ? req.files.imagen[0] : null;
      
      if (imagen) {
        try {
          const imgData = await uploadFileToS3(imagen, "maquina");
          if (imgData && imgData.Location) {
            img_url = imgData.Location;
            updates.img_url = img_url;
          } else {
            errors.push("No se pudo obtener la URL de la imagen");
          }
        } catch (error) {
          errors.push("Error al subir la imagen", error.message);
        }
      }
    }

    if (tipo_maquina_id !== undefined) {
      if (isNaN(parseInt(tipo_maquina_id))) {
        errors.push("Tipo de máquina inválido");
      } 
      const [tipoMaquina] = await pool.query("SELECT * FROM tipo_maquina WHERE id = ? AND isDeleted = 0", [tipo_maquina_id]);
      if (tipoMaquina.length === 0) {
        errors.push("El tipo de máquina con el ID proporcionado no existe o está eliminado.");
      }
      else {
        updates.tipo_maquina_id = tipo_maquina_id;
      }
    }

    if (compania_id !== undefined) {
      if (isNaN(parseInt(compania_id))) {
        errors.push("Compañía inválida");
      }
      const [compania] = await pool.query("SELECT * FROM compania WHERE id = ? AND isDeleted = 0", [compania_id]);
      if (compania.length === 0) {
        errors.push("La compañía con el ID proporcionado no existe o está eliminada.");
      } else {
        updates.compania_id = compania_id;
      }
    }

    if (codigo !== undefined) {
      if (typeof codigo !== 'string') {
        errors.push("Código inválido");
      } else {
        updates.codigo = codigo;
      }
    }

    if (patente !== undefined) {
      if (typeof patente !== 'string') {
        errors.push("Patente inválida");
      } 
      const [patenteExists] = await pool.query("SELECT * FROM maquina WHERE patente = ? AND isDeleted = 0", [patente]);
      if (patenteExists.length > 0) {
        errors.push("Ya existe una máquina con la patente proporcionada.");
      } else {
        updates.patente = patente;
      }
    }

    if (num_chasis !== undefined) {
      if (typeof num_chasis !== 'string') {
        errors.push("Número de chasis inválido");
      } else {
        updates.num_chasis = num_chasis;
      }
    }

    if (vin !== undefined) {
      if (typeof vin !== 'string') {
        errors.push("VIN inválido");
      } else {
        updates.vin = vin;
      }
    }

    if (bomba !== undefined) {
      if (isNaN(parseFloat(bomba))) {
        errors.push("Bomba inválida");
      } else {
        updates.bomba = bomba;
      }
    }

    if (hmetro_bomba !== undefined) {
      if (isNaN(parseFloat(hmetro_bomba))) {
        errors.push("Hmetro bomba inválido");
      } else {
        updates.hmetro_bomba = hmetro_bomba;
      }
    }

    if (hmetro_motor !== undefined) {
      if (isNaN(parseFloat(hmetro_motor))) {
        errors.push("Hmetro motor inválido");
      } else {
        updates.hmetro_motor = hmetro_motor;
      }
    }

    if (kmetraje !== undefined) {
      if (isNaN(parseFloat(kmetraje))) {
        errors.push("Kmetraje inválido");
      } else {
        updates.kmetraje = kmetraje;
      }
    }

    if (num_motor !== undefined) {
      if (typeof num_motor !== 'string') {
        errors.push("Número de motor inválido");
      } else {
        updates.num_motor = num_motor;
      }
    }

    // TODO: Validar fechas
    if (ven_patente !== undefined) {
      const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!fechaRegex.test(ven_patente)) {
        errors.push("Formato de fecha inválido para 'ven_patente'. Debe ser dd-mm-aaaa");
      } else {
        updates.ven_patente = ven_patente;
      }
    }

    if (procedencia_id !== undefined) {
      if (isNaN(parseInt(procedencia_id))) {
        errors.push("Procedencia inválida");
      }
      const [procedencia] = await pool.query("SELECT * FROM procedencia WHERE id = ? AND isDeleted = 0", [procedencia_id]);
      if (procedencia.length === 0) {
        errors.push("La procedencia con el ID proporcionado no existe o está eliminada.");
      } else {
        updates.procedencia_id = procedencia_id;
      }
    }

    if (cost_rev_tec !== undefined) {
      if (isNaN(parseFloat(cost_rev_tec))) {
        errors.push("Costo revisión técnica inválido");
      } else {
        updates.cost_rev_tec = cost_rev_tec;
      }
    }

    if (ven_rev_tec !== undefined) {
      const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!fechaRegex.test(ven_rev_tec)) {
        errors.push("Formato de fecha inválido para 'ven_rev_tec'. Debe ser dd-mm-aaaa");
      } else {
        updates.ven_rev_tec = ven_rev_tec;
      }
    }

    if (cost_seg_auto !== undefined) {
      if (isNaN(parseFloat(cost_seg_auto))) {
        errors.push("Costo seguro auto inválido");
      } else {
        updates.cost_seg_auto = cost_seg_auto;
      }
    }

    if (ven_seg_auto !== undefined) {
      const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!fechaRegex.test(ven_seg_auto)) {
        errors.push("Formato de fecha inválido para 'ven_seg_auto'. Debe ser dd-mm-aaaa");
      } else {
        updates.ven_seg_auto = ven_seg_auto;
      }
    }

    if (isDeleted !== undefined) {
      if (isDeleted !== 0 && isDeleted !== 1) {
        errors.push("Valor inválido para 'isDeleted'. Debe ser 0 o 1.");
      } else {
        updates.isDeleted = isDeleted;
      }
    }
    
    if (disponible !== undefined) {
      if (disponible !== 0 && disponible !== 1) {
        errors.push("Valor inválido para 'disponible'. Debe ser 0 o 1.");
      } else {
        updates.disponible = disponible;
      }
    }

    if (peso_kg !== undefined) {
      if (isNaN(parseInt(peso_kg))) {
        errors.push("Peso en kg inválido");
      } else {
        updates.peso_kg = peso_kg;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors }); // Devolver errores de validación
    }

    // Construir la consulta de actualización
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");

    if (!setClause) {
      return res.status(400).json({ message: "No se proporcionaron campos para actualizar", errors });
    }

    const values = Object.values(updates).concat(idNumber);
    const [result] = await pool.query(`UPDATE maquina SET ${setClause} WHERE id = ?`, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Máquina no encontrada", errors });
    }

    const [rows] = await pool.query('SELECT * FROM maquina WHERE id = ?', [idNumber]);
    res.json(rows[0]);
  } catch (error) {
    errors.push(error.message);
    return res.status(500).json({ message: "Error interno del servidor", errors });
  }
};