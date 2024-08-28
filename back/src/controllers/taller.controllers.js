import { pool } from "../db";

export const getTaller = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM taller");
    res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const getTallerById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM taller WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length <= 0)
      return res.status(404).json({
        message: "taller no encontrado",
      });
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const createTaller = async (req, res) => {
  const { nombre, fono } = req.body;

  try {
    const [rows] = await pool.query(
      "INSERT INTO taller (nombre, fono) VALUES (?, ?)",
      [nombre, fono]
    );

    res.send({
      id: rows.insertId,
      nombre,
      fono,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const deleteTaller = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM taller WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({
        message: "taller no encontrado",
      });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const updateTaller = async (req, res) => {
  const { id } = req.params;
  const { nombre, fono } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE taller SET nombre = IFNULL(?, nombre), fono = IFNULL(?, fono) WHERE id = ?",
      [nombre, fono, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "taller no encontrado",
      });
    }

    const [rows] = await pool.query("SELECT * FROM taller WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};
