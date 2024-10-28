import { pool } from "../db.js";

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
      "INSERT INTO maquina (tipo_maquina_id, compania_id, codigo, patente, num_chasis, vin, bomba, hmetro_bomba, hmetro_motor, kmetraje, num_motor, ven_patente, procedencia_id, cost_rev_tec, ven_rev_tec, cost_seg_auto, ven_seg_auto, isDeleted, img_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, STR_TO_DATE(?, '%d-%m-%Y'), 0, '')",
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
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
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
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
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
    isDeleted,
  } = req.body;

  try {
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    // Validaciones
    const updates = {};

    if (tipo_maquina_id !== undefined) {
      if (isNaN(parseInt(tipo_maquina_id))) {
        return res.status(400).json({ message: "Tipo de máquina inválido" });
      }
      updates.tipo_maquina_id = tipo_maquina_id;
    }

    if (compania_id !== undefined) {
      if (isNaN(parseInt(compania_id))) {
        return res.status(400).json({ message: "Compañía inválida" });
      }
      updates.compania_id = compania_id;
    }

    if (codigo !== undefined) {
      if (typeof codigo !== 'string') {
        return res.status(400).json({ message: "Código inválido" });
      }
      updates.codigo = codigo;
    }

    if (patente !== undefined) {
      if (typeof patente !== 'string') {
        return res.status(400).json({ message: "Patente inválida" });
      }
      updates.patente = patente;
    }

    if (num_chasis !== undefined) {
      if (typeof num_chasis !== 'string') {
        return res.status(400).json({ message: "Número de chasis inválido" });
      }
      updates.num_chasis = num_chasis;
    }

    if (vin !== undefined) {
      if (typeof vin !== 'string') {
        return res.status(400).json({ message: "VIN inválido" });
      }
      updates.vin = vin;
    }

    if (bomba !== undefined) {
      if (isNaN(parseFloat(bomba))) {
        return res.status(400).json({ message: "Bomba inválida" });
      }
      updates.bomba = bomba;
    }

    if (hmetro_bomba !== undefined) {
      if (isNaN(parseFloat(hmetro_bomba))) {
        return res.status(400).json({ message: "Hmetro bomba inválido" });
      }
      updates.hmetro_bomba = hmetro_bomba;
    }

    if (hmetro_motor !== undefined) {
      if (isNaN(parseFloat(hmetro_motor))) {
        return res.status(400).json({ message: "Hmetro motor inválido" });
      }
      updates.hmetro_motor = hmetro_motor;
    }

    if (kmetraje !== undefined) {
      if (isNaN(parseFloat(kmetraje))) {
        return res.status(400).json({ message: "Kmetraje inválido" });
      }
      updates.kmetraje = kmetraje;
    }

    if (num_motor !== undefined) {
      if (typeof num_motor !== 'string') {
        return res.status(400).json({ message: "Número de motor inválido" });
      }
      updates.num_motor = num_motor;
    }

    if (ven_patente !== undefined) {
      const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!fechaRegex.test(ven_patente)) {
        return res.status(400).json({ message: "Formato de fecha inválido para 'ven_patente'. Debe ser dd-mm-aaaa" });
      }
      updates.ven_patente = ven_patente;
    }

    if (procedencia_id !== undefined) {
      if (isNaN(parseInt(procedencia_id))) {
        return res.status(400).json({ message: "Procedencia inválida" });
      }
      updates.procedencia_id = procedencia_id;
    }

    if (cost_rev_tec !== undefined) {
      if (isNaN(parseFloat(cost_rev_tec))) {
        return res.status(400).json({ message: "Costo revisión técnica inválido" });
      }
      updates.cost_rev_tec = cost_rev_tec;
    }

    if (ven_rev_tec !== undefined) {
      const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!fechaRegex.test(ven_rev_tec)) {
        return res.status(400).json({ message: "Formato de fecha inválido para 'ven_rev_tec'. Debe ser dd-mm-aaaa" });
      }
      updates.ven_rev_tec = ven_rev_tec;
    }

    if (cost_seg_auto !== undefined) {
      if (isNaN(parseFloat(cost_seg_auto))) {
        return res.status(400).json({ message: "Costo seguro auto inválido" });
      }
      updates.cost_seg_auto = cost_seg_auto;
    }

    if (ven_seg_auto !== undefined) {
      const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!fechaRegex.test(ven_seg_auto)) {
        return res.status(400).json({ message: "Formato de fecha inválido para 'ven_seg_auto'. Debe ser dd-mm-aaaa" });
      }
      updates.ven_seg_auto = ven_seg_auto;
    }

    // Validación y actualización de isDeleted
    if (isDeleted !== undefined) {
      if (isDeleted !== 0 && isDeleted !== 1) {
        return res.status(400).json({ message: "Valor inválido para 'isDeleted'. Debe ser 0 o 1." });
      }
      updates.isDeleted = isDeleted;
    }

    // Construir la consulta de actualización
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");

    if (!setClause) {
      return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
    }

    const values = Object.values(updates).concat(idNumber);
    const [result] = await pool.query(`UPDATE maquina SET ${setClause} WHERE id = ?`, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Máquina no encontrada" });
    }

    const [rows] = await pool.query('SELECT * FROM maquina WHERE id = ?', [idNumber]);
    res.json(rows[0]);
    // res.json({ message: "Máquina actualizada" });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

const value = "maquina";
const folder=value;
const tableName=value;

export const updateImage = async (req, res) => {
    const { id } = req.params;
    const file = req.file;

    // console.log({
    //     id: id,
    //     file: file,
    //     folder: folder,
    //     tableName: tableName
    // });


    if (!file) {
        return res.status(400).json({ message: "Falta el archivo." });
    }

    try {
        const data = await uploadFileToS3(file, folder);
        const newUrl = data.Location;
        await updateImageUrlInDb(id, newUrl, tableName); // Pasa el nombre de la tabla
        res.status(200).json({ message: "Imagen actualizada con éxito", url: newUrl });
    } catch (error) {
        handleError(res, error, "Error al actualizar la imagen");
    }
};