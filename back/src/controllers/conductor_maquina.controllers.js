import { pool } from "../db.js";

export const getConductorMaquina = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM conductor_maquina");
    res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const getConductorMaquinaById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM conductor_maquina WHERE id = ?",
      [req.params.id]
    );
    if (rows.length <= 0)
      return res.status(404).json({
        message: "conductor_maquina no encontrado",
      });
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const createConductorMaquina = async (req, res) => {
  const {
    personal_id,
    rol_personal_id,
    maquina_id,
    tipo_maquina_id,
    ven_licencia,
  } = req.body;

  try {
    const [rows] = await pool.query(
      "INSERT INTO conductor_maquina (personal_id, rol_personal_id, maquina_id, tipo_maquina_id, ven_licencia) VALUES (?, ?, ?, ?, ?)",
      [personal_id, rol_personal_id, maquina_id, tipo_maquina_id, ven_licencia]
    );

    res.send({
      id: rows.insertId,
      personal_id,
      rol_personal_id,
      maquina_id,
      tipo_maquina_id,
      ven_licencia,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const deleteConductorMaquina = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM conductor_maquina WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({
        message: "conductor_maquina no encontrado",
      });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const updateConductorMaquina = async (req, res) => {
  const { id } = req.params;
  const {
    personal_id,
    rol_personal_id,
    maquina_id,
    tipo_maquina_id,
    ven_licencia,
  } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE conductor_maquina SET" +
        "personal_id = IFNULL(?, personal_id)," +
        "rol_personal_id = IFNULL(?, rol_personal_id)," +
        "maquina_id = IFNULL(?, maquina_id)," +
        "tipo_maquina_id = IFNULL(?, tipo_maquina_id)," +
        "ven_licencia = IFNULL(?, ven_licencia)" +
        "WHERE id = ?",
      [
        personal_id,
        rol_personal_id,
        maquina_id,
        tipo_maquina_id,
        ven_licencia,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "conductor_maquina no encontrado",
      });
    }

    const [rows] = await pool.query(
      "SELECT * FROM conductor_maquina WHERE id = ?",
      [id]
    );
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};
