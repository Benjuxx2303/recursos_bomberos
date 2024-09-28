import { pool } from "../db.js";

export const getBitacora = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM bitacora");
    res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const getBitacoraById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM bitacora WHERE id = ? AND compania_id = ? AND conductor_id = ? AND clave_id = ?",
      [
        req.params.id,
        req.params.compania_id,
        req.params.conductor_id,
        req.params.clave_id,
      ]
    );
    if (rows.length <= 0)
      return res.status(404).json({
        message: "Bitácora no encontrada",
      });
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const createBitacora = async (req, res) => {
  const {
    compania_id,
    conductor_id,
    direccion,
    fecha,
    h_salida,
    h_llegada,
    clave_id,
    km_salida,
    km_llegada,
    hmetro_salida,
    hmetro_llegada,
    hbomba_salida,
    hbomba_llegada,
    obs,
  } = req.body;

  try {
    const [rows] = await pool.query(
      "INSERT INTO bitacora (compania_id, conductor_id, direccion, fecha, h_salida, h_llegada, clave_id, km_salida, km_llegada, hmetro_salida, hmetro_llegada, hbomba_salida, hbomba_llegada, obs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        compania_id, // fk
        conductor_id, // fk
        direccion,
        fecha,
        h_salida,
        h_llegada,
        clave_id, // fk
        km_salida,
        km_llegada,
        hmetro_salida,
        hmetro_llegada,
        hbomba_salida,
        hbomba_llegada,
        obs,
      ]
    );

    res.send({
      id: rows.insertId,
      compania_id,
      conductor_id,
      direccion,
      fecha,
      h_salida,
      h_llegada,
      clave_id,
      km_salida,
      km_llegada,
      hmetro_salida,
      hmetro_llegada,
      hbomba_salida,
      hbomba_llegada,
      obs,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const deleteBitacora = async (req, res) => {
  const { id, compania_id, conductor_id, clave_id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM bitacora WHERE id = ? AND compania_id = ? AND conductor_id = ? AND clave_id = ?",
      [id, compania_id, conductor_id, clave_id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({
        message: "Bitácora no encontrada",
      });
    res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

// TODO: Revisar código
export const updateBitacora = async (req, res) => {
  const { id, compania_id, conductor_id, clave_id } = req.params;
  const {
    direccion,
    fecha,
    h_salida,
    h_llegada,
    km_salida,
    km_llegada,
    hmetro_salida,
    hmetro_llegada,
    hbomba_salida,
    hbomba_llegada,
    obs,
  } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE bitacora SET " +
        "direccion = IFNULL(?, direccion), " +
        "fecha = IFNULL(?, fecha), " +
        "h_salida = IFNULL(?, h_salida), " +
        "h_llegada = IFNULL(?, h_llegada), " +
        "km_salida = IFNULL(?, km_salida), " +
        "km_llegada = IFNULL(?, km_llegada), " +
        "hmetro_salida = IFNULL(?, hmetro_salida), " +
        "hmetro_llegada = IFNULL(?, hmetro_llegada), " +
        "hbomba_salida = IFNULL(?, hbomba_salida), " +
        "hbomba_llegada = IFNULL(?, hbomba_llegada), " +
        "obs = IFNULL(?, obs) " +
        "WHERE id = ? AND compania_id = ? AND conductor_id = ? AND clave_id = ?",
      [
        direccion,
        fecha,
        h_salida,
        h_llegada,
        km_salida,
        km_llegada,
        hmetro_salida,
        hmetro_llegada,
        hbomba_salida,
        hbomba_llegada,
        obs,
        id,
        compania_id,
        conductor_id,
        clave_id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Bitácora no encontrada",
      });
    }

    const [rows] = await pool.query(
      "SELECT * FROM bitacora WHERE id = ? AND compania_id = ? AND conductor_id = ? AND clave_id = ?",
      [id, compania_id, conductor_id, clave_id]
    );
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};
