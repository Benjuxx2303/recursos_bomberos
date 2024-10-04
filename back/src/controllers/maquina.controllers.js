import { pool } from "../db.js";

// Obtener todas las máquinas
export const getMaquinas = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM maquina WHERE isDeleted = 0");
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Obtener detalles de las máquinas
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
      WHERE m.isDeleted = 0
    `);
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Obtener máquina por ID
export const getMaquinaById = async (req, res) => {
  const { id } = req.params;
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
      WHERE m.id = ? AND m.isDeleted = 0
    `, [id]);
    
    if (rows.length <= 0) return res.status(404).json({ message: "Máquina no encontrada" });
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Crear nueva máquina
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
    // Validaciones de tipo de datos
    if (
      isNaN(parseInt(tipo_maquina_id)) ||
      isNaN(parseInt(compania_id)) ||
      typeof codigo !== 'string' ||
      typeof patente !== 'string' ||
      typeof num_chasis !== 'string' ||
      typeof vin !== 'string' ||
      isNaN(parseFloat(cost_rev_tec)) ||
      isNaN(parseFloat(cost_seg_auto))
    ) {
      return res.status(400).json({ message: 'Tipo de datos inválido' });
    }

    // Validación de llaves foráneas
    const [tipoMaquina] = await pool.query("SELECT * FROM tipo_maquina WHERE id = ? AND isDeleted = 0", [tipo_maquina_id]);
    if (tipoMaquina.length === 0) return res.status(400).json({ message: 'Tipo de máquina no existe' });

    const [compania] = await pool.query("SELECT * FROM compania WHERE id = ? AND isDeleted = 0", [compania_id]);
    if (compania.length === 0) return res.status(400).json({ message: 'Compañía no existe' });

    const [procedencia] = await pool.query("SELECT * FROM procedencia WHERE id = ? AND isDeleted = 0", [procedencia_id]);
    if (procedencia.length === 0) return res.status(400).json({ message: 'Procedencia no existe' });

    // Validación de fechas
    const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    const fechas = [ven_patente, ven_rev_tec, ven_seg_auto];
    for (const fecha of fechas) {
      if (fecha && !fechaRegex.test(fecha)) {
        return res.status(400).json({ message: 'Formato de fecha inválido. Debe ser dd-mm-aaaa' });
      }
    }

    // Inserción en la base de datos
    const [rows] = await pool.query(
      "INSERT INTO maquina (tipo_maquina_id, compania_id, codigo, patente, num_chasis, vin, bomba, hmetro_bomba, hmetro_motor, kmetraje, num_motor, ven_patente, procedencia_id, cost_rev_tec, ven_rev_tec, cost_seg_auto, ven_seg_auto, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, STR_TO_DATE(?, '%d-%m-%Y'), 0)",
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

    res.status(201).json({ id: rows.insertId, ...req.body });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Eliminar máquina (cambiar estado)
export const deleteMaquina = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("UPDATE maquina SET isDeleted = 1 WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Máquina no encontrada" });
    res.status(204).end();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Actualizar máquina
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
    // Validaciones de tipo de datos
    if (
      isNaN(parseInt(tipo_maquina_id)) ||
      isNaN(parseInt(compania_id)) ||
      typeof codigo !== 'string' ||
      typeof patente !== 'string' ||
      typeof num_chasis !== 'string' ||
      typeof vin !== 'string' ||
      isNaN(parseFloat(cost_rev_tec)) ||
      isNaN(parseFloat(cost_seg_auto))
    ) {
      return res.status(400).json({ message: 'Tipo de datos inválido' });
    }

    // Validación de llaves foráneas
    const [tipoMaquina] = await pool.query("SELECT * FROM tipo_maquina WHERE id = ? AND isDeleted = 0", [tipo_maquina_id]);
    if (tipoMaquina.length === 0) return res.status(400).json({ message: 'Tipo de máquina no existe' });

    const [compania] = await pool.query("SELECT * FROM compania WHERE id = ? AND isDeleted = 0", [compania_id]);
    if (compania.length === 0) return res.status(400).json({ message: 'Compañía no existe' });

    const [procedencia] = await pool.query("SELECT * FROM procedencia WHERE id = ? AND isDeleted = 0", [procedencia_id]);
    if (procedencia.length === 0) return res.status(400).json({ message: 'Procedencia no existe' });

    // Validación de fechas
    const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    const fechas = [ven_patente, ven_rev_tec, ven_seg_auto];
    for (const fecha of fechas) {
      if (fecha && !fechaRegex.test(fecha)) {
        return res.status(400).json({ message: 'Formato de fecha inválido. Debe ser dd-mm-aaaa' });
      }
    }

    // Actualización en la base de datos
    const [result] = await pool.query(
      "UPDATE maquina SET tipo_maquina_id = ?, compania_id = ?, codigo = ?, patente = ?, num_chasis = ?, vin = ?, bomba = ?, hmetro_bomba = ?, hmetro_motor = ?, kmetraje = ?, num_motor = ?, ven_patente = STR_TO_DATE(?, '%d-%m-%Y'), procedencia_id = ?, cost_rev_tec = ?, ven_rev_tec = STR_TO_DATE(?, '%d-%m-%Y'), cost_seg_auto = ?, ven_seg_auto = STR_TO_DATE(?, '%d-%m-%Y') WHERE id = ?",
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

    if (result.affectedRows === 0) return res.status(404).json({ message: "Máquina no encontrada" });
    res.json({ message: "Máquina actualizada" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
