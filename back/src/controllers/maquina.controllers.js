import { pool } from "../db.js";

export const getMaquinas = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM maquina");
    res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const getMaquinasDetails = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        m.id AS maquina_id,
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
        tm.clasificacion AS tipo_maquina,
        c.nombre AS compania,
        p.nombre AS procedencia
      FROM maquina m
      INNER JOIN tipo_maquina tm ON m.tipo_maquina_id = tm.id
      INNER JOIN compania c ON m.compania_id = c.id
      INNER JOIN procedencia p ON m.procedencia_id = p.id
    `);

    res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

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
