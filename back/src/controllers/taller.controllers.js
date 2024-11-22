import { pool } from "../db.js";

// Devuelve todos los talleres
export const getTalleres = async (req, res) => {
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

    // Si no se proporciona "page", devolver todos los datos sin paginación
    if (!req.query.page) {
      const query = `
        SELECT t.id, t.nombre, t.fono
        FROM taller t
        WHERE t.isDeleted = 0
      `;
      const [rows] = await pool.query(query);
      return res.json(rows); // Devuelve todos los registros sin paginación
    }

    // Si se proporciona "page", se aplica paginación
    const offset = (page - 1) * pageSize; // Calcular el offset

    const query = `
      SELECT t.id, t.nombre, t.fono
      FROM taller t
      WHERE t.isDeleted = 0
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
      message: "Error interno del servidor",
      error: error.message
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
      message: "Error interno del servidor",
      error: error.message
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
      message: "Error interno del servidor",
      error: error.message
  });
  }
};

// Actualizar taller
export const updateTaller = async (req, res) => {
  const { id } = req.params;
  const { nombre, fono, isDeleted } = req.body;

  try {
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return res.status(400).json({
        message: "ID inválido"
      });
    }

    // Validaciones
    const updates = {};
    if (nombre !== undefined) {
      if (typeof nombre !== "string") {
        return res.status(400).json({
          message: "Tipo de dato inválido para 'nombre'"
        });
      }
      updates.nombre = nombre;
    }

    if (fono !== undefined) {
      if (typeof fono !== "string") {
        return res.status(400).json({
          message: "Tipo de dato inválido para 'fono'"
        });
      }
      updates.fono = fono;
    }

    if (isDeleted !== undefined) {
      if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
        return res.status(400).json({
          message: "Tipo de dato inválido para 'isDeleted'"
        });
      }
      updates.isDeleted = isDeleted;
    }

    // Construir la consulta de actualización
    const setClause = Object.keys(updates)
      .map((key) => `${key} = IFNULL(?, ${key})`)
      .join(", ");

    if (!setClause) {
      return res.status(400).json({
        message: "No se proporcionaron campos para actualizar"
      });
    }

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

    const [rows] = await pool.query("SELECT * FROM taller WHERE id = ?", [idNumber]);
    res.json(rows[0]);
  } catch (error) {
    console.error('error: ', error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
  });
  }
};
