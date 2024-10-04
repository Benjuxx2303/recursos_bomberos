import { pool } from "../db.js";

// Devuelve todos los talleres
export const getTaller = async (req, res) => {
  try {
    const query = `
      SELECT t.id, t.nombre, t.fono
      FROM taller t
      WHERE t.isDeleted = 0
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Devuelve taller por id
export const getTallerById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM taller WHERE id = ? AND isDeleted = 0", [id]);
    if (rows.length <= 0) {
      return res.status(404).json({
        message: "Taller no encontrado",
      });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Crear nuevo taller
export const createTaller = async (req, res) => {
  const { nombre, fono } = req.body;

  try {
    // Validaciones
    if (typeof nombre !== 'string' || typeof fono !== 'string') {
      return res.status(400).json({
        message: 'Tipo de datos inválido',
      });
    }

    // Inserción en la base de datos
    const [rows] = await pool.query(
      "INSERT INTO taller (nombre, fono, isDeleted) VALUES (?, ?, 0)",
      [nombre, fono]
    );

    res.status(201).json({
      id: rows.insertId,
      nombre,
      fono,
    });
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
    });
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
      message: 'Error interno del servidor',
    });
  }
};

// Actualizar taller
export const updateTaller = async (req, res) => {
  const { id } = req.params;
  const { nombre, fono } = req.body;

  try {
    // Validaciones
    if (typeof nombre !== 'string' || typeof fono !== 'string') {
      return res.status(400).json({
        message: 'Tipo de datos inválido',
      });
    }

    const [result] = await pool.query(
      "UPDATE taller SET nombre = IFNULL(?, nombre), fono = IFNULL(?, fono) WHERE id = ? AND isDeleted = 0",
      [nombre, fono, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Taller no encontrado",
      });
    }

    const [rows] = await pool.query("SELECT * FROM taller WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  }
};
