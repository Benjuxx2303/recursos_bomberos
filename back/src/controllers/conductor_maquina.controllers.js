import { pool } from "../db.js";

// TODO: falta validacion de rol si es conductor

export const getConductorMaquina = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM conductor_maquina WHERE isDeleted = 0");
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// paginacion
export const getConductorMaquinaPage = async (req, res) => {
  try {
    // Obtener los parámetros de la página y el tamaño de página
    const page = parseInt(req.query.page) || 1;  // Si no se proporciona, se asume la primera página
    const pageSize = parseInt(req.query.pageSize) || 10;  // Si no se proporciona, se asume un tamaño de página de 10

    // Calcular el offset para la paginación
    const offset = (page - 1) * pageSize;

    // Consulta con paginación
    const query = `
      SELECT * 
      FROM conductor_maquina 
      WHERE isDeleted = 0
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [pageSize, offset]);
    res.json(rows);

  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

export const getConductorMaquinaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validación de datos
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return res.status(400).json({ message: "Tipo de datos inválido" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM conductor_maquina WHERE id = ? AND isDeleted = 0",
      [idNumber]
    );
    
    if (rows.length <= 0) {
      return res.status(404).json({ message: "conductor_maquina no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

export const createConductorMaquina = async (req, res) => {
  const { personal_id, maquina_id, tipo_maquina_id, ven_licencia } = req.body;

  try {
    // Validación de datos
    const personalIdNumber = parseInt(personal_id);
    const maquinaIdNumber = parseInt(maquina_id);
    const tipoMaquinaIdNumber = parseInt(tipo_maquina_id);

    if (
      isNaN(personalIdNumber) ||
      isNaN(maquinaIdNumber) ||
      isNaN(tipoMaquinaIdNumber) ||
      typeof ven_licencia !== 'string' // Debe ser un string para validación de fecha
    ) {
      return res.status(400).json({ message: 'Tipo de datos inválido' });
    }

    // Validación de existencia de llaves foráneas
    const [checkPersonal] = await pool.query("SELECT * FROM personal WHERE id = ? AND isDeleted = 0", [personalIdNumber]);
    if (checkPersonal.length === 0) return res.status(400).json({ message: "ID de personal no válido" });

    const [checkMaquina] = await pool.query("SELECT * FROM maquina WHERE id = ? AND isDeleted = 0", [maquinaIdNumber]);
    if (checkMaquina.length === 0) return res.status(400).json({ message: "ID de máquina no válido" });

    const [checkTipoMaquina] = await pool.query("SELECT * FROM tipo_maquina WHERE id = ? AND isDeleted = 0", [tipoMaquinaIdNumber]);
    if (checkTipoMaquina.length === 0) return res.status(400).json({ message: "ID de tipo de máquina no válido" });

    // Validación de fecha
    const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    if (!fechaRegex.test(ven_licencia)) {
      return res.status(400).json({
        message: 'El formato de la fecha es inválido. Debe ser dd-mm-aaaa'
      });
    }

    // Inserción en la base de datos
    const [rows] = await pool.query(
      "INSERT INTO conductor_maquina (personal_id, maquina_id, tipo_maquina_id, ven_licencia, isDeleted) VALUES (?, ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), 0)",
      [
        personalIdNumber,
        maquinaIdNumber,
        tipoMaquinaIdNumber,
        ven_licencia
      ]
    );

    res.status(201).json({
      id: rows.insertId,
      personal_id: personalIdNumber,
      maquina_id: maquinaIdNumber,
      tipo_maquina_id: tipoMaquinaIdNumber,
      ven_licencia,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};




export const deleteConductorMaquina = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Validación de datos
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return res.status(400).json({ message: "Tipo de datos inválido" });
    }

    const [result] = await pool.query(
      "UPDATE conductor_maquina SET isDeleted = 1 WHERE id = ?",
      [idNumber]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "conductor_maquina no encontrado" });
    }
    res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

export const updateConductorMaquina = async (req, res) => {
  const { id } = req.params;
  const { personal_id, rol_personal_id, maquina_id, tipo_maquina_id, ven_licencia, isDeleted } = req.body;

  try {
    // Validación de datos
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const updates = {};
    if (personal_id !== undefined) {
      if (typeof personal_id !== "number") {
        return res.status(400).json({ message: "Tipo de dato inválido para 'personal_id'" });
      }
      updates.personal_id = personal_id;
    }

    if (rol_personal_id !== undefined) {
      if (typeof rol_personal_id !== "number") {
        return res.status(400).json({ message: "Tipo de dato inválido para 'rol_personal_id'" });
      }
      updates.rol_personal_id = rol_personal_id;
    }

    if (maquina_id !== undefined) {
      if (typeof maquina_id !== "number") {
        return res.status(400).json({ message: "Tipo de dato inválido para 'maquina_id'" });
      }
    }

    if (tipo_maquina_id !== undefined) {
      if (typeof tipo_maquina_id !== "number") {
        return res.status(400).json({ message: "Tipo de dato inválido para 'tipo_maquina_id'" });
      }
      updates.tipo_maquina_id = tipo_maquina_id;
    }

    if (ven_licencia !== undefined) {
      const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/; // Formato dd-mm-yyyy
      if (typeof ven_licencia !== 'string' || !fechaRegex.test(ven_licencia)) {
        return res.status(400).json({
          message: 'El formato de la fecha es inválido. Debe ser dd-mm-aaaa'
        });
      }
      updates.ven_licencia = ven_licencia;
    }

    if (isDeleted !== undefined) {
      if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
        return res.status(400).json({ message: "Tipo de dato inválido para 'isDeleted'" });
      }
      updates.isDeleted = isDeleted;
    }

    // Validación de llaves foráneas
    if (personal_id) {
      const [checkPersonal] = await pool.query("SELECT * FROM personal WHERE id = ? AND isDeleted = 0", [personal_id]);
      if (checkPersonal.length === 0) return res.status(400).json({ message: "ID de personal no válido" });
    }

    if (maquina_id) {
      const [checkMaquina] = await pool.query("SELECT * FROM maquina WHERE id = ? AND isDeleted = 0", [maquina_id]);
      if (checkMaquina.length === 0) return res.status(400).json({ message: "ID de máquina no válido" });
    }

    if (tipo_maquina_id) {
      const [checkTipoMaquina] = await pool.query("SELECT * FROM tipo_maquina WHERE id = ? AND isDeleted = 0", [tipo_maquina_id]);
      if (checkTipoMaquina.length === 0) return res.status(400).json({ message: "ID de tipo de máquina no válido" });
    }

    // Construir la consulta de actualización
    const setClause = Object.keys(updates)
      .map((key) => {
        if (key === 'ven_licencia') {
          return `ven_licencia = STR_TO_DATE(?, '%d-%m-%Y')`;
        }
        return `${key} = ?`;
      })
      .join(", ");

    if (!setClause) {
      return res.status(400).json({
        message: "No se proporcionaron campos para actualizar"
      });
    }

    const values = Object.values(updates).concat(idNumber);
    const [result] = await pool.query(`UPDATE conductor_maquina SET ${setClause} WHERE id = ? AND isDeleted = 0`, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Conductor de máquina no encontrado" });
    }

    const [rows] = await pool.query("SELECT * FROM conductor_maquina WHERE id = ?", [idNumber]);
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};
