import { pool } from "../db";
// TODO: SELECTs CON INNER JOIN


export const getMaquina = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM maquina");
    res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

// 
export const getMaquinaById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM maquina WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length <= 0)
      return res.status(404).json({
        message: "maquina no encontrada",
      });
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const createMaquina = async (req, res) => {
  const {
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
  } = req.body;

  try {
    const [rows] = await pool.query(
      "INSERT INTO maquina (tipo_maquina_id, compania_id, codigo, patente, num_chasis, vin, bomba, hmetro_bomba, hmetro_motor, kmetraje, num_motor, ven_patente, procedencia_id, cost_rev_tec, ven_rev_tec, cost_seg_auto, ven_seg_auto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
      ]
    );

    res.send({
      id: rows.insertId,
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
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

// TODO: eliminar maquina?
export const deleteMaquina = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM maquina WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({
        message: "maquina no encontrada",
      });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const updateMaquina = async (req, res) => {
  const { id } = req.params;
  const {
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
  } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE maquina SET" +
        "tipo_maquina_id = IFNULL(?, tipo_maquina_id)," +
        "compania_id = IFNULL(?, compania_id)," +
        "codigo = IFNULL(?, codigo)," +
        "patente = IFNULL(?, patente)," +
        "num_chasis = IFNULL(?, num_chasis)," +
        "vin = IFNULL(?, vin)," +
        "bomba = IFNULL(?, bomba)," +
        "hmetro_bomba = IFNULL(?, hmetro_bomba)," +
        "hmetro_motor = IFNULL(?, hmetro_motor)," +
        "kmetraje = IFNULL(?, kmetraje)," +
        "num_motor = IFNULL(?, num_motor)," +
        "ven_patente = IFNULL(?, ven_patente)," +
        "procedencia_id = IFNULL(?, procedencia_id)," +
        "cost_rev_tec = IFNULL(?, cost_rev_tec)," +
        "ven_rev_tec = IFNULL(?, ven_rev_tec)," +
        "cost_seg_auto = IFNULL(?, cost_seg_auto)," +
        "ven_seg_auto = IFNULL(?, ven_seg_auto)" +
        "WHERE id = ?",
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
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "máquina no encontrada",
      });
    }

    const [rows] = await pool.query("SELECT * FROM maquina WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};
