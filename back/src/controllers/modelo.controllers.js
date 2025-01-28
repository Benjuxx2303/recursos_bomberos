import { pool } from "../db.js";
import { uploadFileToS3 } from "../utils/fileUpload.js";

// Devuelve todos los modelos
export const getModelos = async (req, res) => {
  try {
    const query = `
            SELECT m.id, m.nombre, m.peso_kg , m.img_url, ma.nombre AS marca, t.nombre AS tipo_maquina, t.descripcion AS tipo_maquina_descripcion
            FROM modelo m
            JOIN marca ma ON m.marca_id = ma.id
            JOIN tipo_maquina t ON m.tipo_maquina_id = t.id
            WHERE m.isDeleted = 0
        `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Devuelve todos los modelos con paginación opcional
export const getModelosPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const offset = (page - 1) * pageSize;
    const query = `
            SELECT m.id, m.nombre, m.peso_kg, m.img_url, ma.nombre AS marca, t.nombre AS tipo_maquina, t.descripcion AS tipo_maquina_descripcion
            FROM modelo m
            JOIN marca ma ON m.marca_id = ma.id
            JOIN tipo_maquina t ON m.tipo_maquina_id = t.id
            WHERE m.isDeleted = 0
            LIMIT ? OFFSET ?
        `;
    const [rows] = await pool.query(query, [pageSize, offset]);
    res.json(rows);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Devuelve modelo por ID
export const getModeloById = async (req, res) => {
  const { id } = req.params;
  try {
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const query = `
            SELECT m.id, m.nombre, m.peso_kg , m.img_url,ma.nombre AS marca, t.nombre AS tipo_maquina, t.descripcion AS tipo_maquina_descripcion
            FROM modelo m
            JOIN marca ma ON m.marca_id = ma.id
            JOIN tipo_maquina t ON m.tipo_maquina_id = t.id
            WHERE m.id = ? AND m.isDeleted = 0
        `;
    const [rows] = await pool.query(query, [idNumber]);
    if (rows.length <= 0) {
      return res.status(404).json({
        message: "Modelo no encontrado",
      });
    }
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Crear modelo
export const createModelo = async (req, res) => {
  const { nombre, marca_id, tipo_maquina_id, peso_kg, img_url } = req.body;

  try {
    if (
      typeof nombre !== "string" ||
      isNaN(marca_id) ||
      isNaN(tipo_maquina_id)
    ) {
      return res.status(400).json({
        message: "Datos inválidos",
      });
    }

    const [rows] = await pool.query(
      "INSERT INTO modelo (nombre, marca_id, tipo_maquina_id, peso_kg, img_url) VALUES (?, ?, ?,?,?)",
      [nombre, marca_id, tipo_maquina_id, peso_kg, img_url]
    );
    res.status(201).json({
      id: rows.insertId,
      nombre,
      marca_id,
      tipo_maquina_id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Eliminar modelo
export const deleteModelo = async (req, res) => {
  const { id } = req.params;

  try {
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const [result] = await pool.query(
      "UPDATE modelo SET isDeleted = 1 WHERE id = ?",
      [idNumber]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Modelo no encontrado",
      });
    }

    res.status(204).end();
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Actualizar modelo
export const updateModelo = async (req, res) => {
  const { id } = req.params;
  const { nombre, marca_id, tipo_maquina_id, peso_kg, img_url } = req.body;

  try {
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    if (
      typeof nombre !== "string" ||
      isNaN(marca_id) ||
      isNaN(tipo_maquina_id)
    ) {
      return res.status(400).json({
        message: 'Tipo de dato inválido para "nombre"',
      });
    }

    const [result] = await pool.query(
      "UPDATE modelo SET nombre = ?, marca_id = ?, tipo_maquina_id = ? , peso_kg = ? , img_url = ? WHERE id = ?",
      [nombre, marca_id, tipo_maquina_id, idNumber]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Modelo no encontrado",
      });
    }

    // Manejar la carga de imágenes si existen
    if (req.files && req.files.imagen) {
      try {
        const imgData = await uploadFileToS3(req.files.imagen[0], "maquina");
        if (imgData && imgData.Location) {
          img_url = imgData.Location; // Guardar URL de la imagen
        } else {
          errors.push("No se pudo obtener la URL de la imagen.");
        }
      } catch (error) {
        errors.push(`Error al subir la imagen: ${error.message}`);
      }
    }

    const [rows] = await pool.query(
      `
            SELECT m.id, m.nombre, ma.nombre AS marca, t.nombre AS tipo_maquina, t.descripcion AS tipo_maquina_descripcion
            FROM modelo m
            JOIN marca ma ON m.marca_id = ma.id
            JOIN tipo_maquina t ON m.tipo_maquina_id = t.id
            WHERE m.id = ?
        `,
      [idNumber]
    );
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};
