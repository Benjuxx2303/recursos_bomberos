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
  const { personal_id, maquina_id } = req.body;
  const errors = []; // Arreglo para capturar errores

  try {
    // Validación de datos
    const personalIdNumber = parseInt(personal_id);
    const maquinaIdNumber = parseInt(maquina_id);

    if (isNaN(personalIdNumber) || isNaN(maquinaIdNumber)) {
      errors.push('Tipo de datos inválido');
    }

    // Validación de existencia de llaves foráneas
    const [checkPersonal] = await pool.query("SELECT * FROM personal WHERE id = ? AND isDeleted = 0", [personalIdNumber]);
    if (checkPersonal.length === 0) {
      errors.push("ID de personal no válido");
    }

    const [checkMaquina] = await pool.query("SELECT * FROM maquina WHERE id = ? AND isDeleted = 0", [maquinaIdNumber]);
    if (checkMaquina.length === 0) {
      errors.push("ID de máquina no válido");
    }

    // validar si el personal ya esta asignado a esa maquina y viceversa
    const [checkConductorMaquina] = await pool.query("SELECT * FROM conductor_maquina WHERE personal_id = ? AND maquina_id = ? AND isDeleted = 0", [personalIdNumber, maquinaIdNumber]);
    if (checkConductorMaquina.length > 0) {
      errors.push("El personal ya está asignado a esa máquina");
    }

    // Si se encontraron errores, devolverlos
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Inserción en la base de datos
    const [rows] = await pool.query(
      "INSERT INTO conductor_maquina (personal_id, maquina_id, isDeleted) VALUES (?, ?, 0)",
      [personalIdNumber, maquinaIdNumber]
    );

    res.status(201).json({
      id: rows.insertId,
      personal_id: personalIdNumber,
      maquina_id: maquinaIdNumber
    });
  } catch (error) {
    errors.push(error.message);
    return res.status(500).json({ message: "Error interno del servidor", errors });
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
  const { personal_id, maquina_id, isDeleted } = req.body;
  const errors = [];
  const updates = {};

  try {
    // Validación de ID
    const idNumber = parseInt(id, 10);
    if (isNaN(idNumber)) {
      return res.status(400).json({ errors: ["ID inválido"] });
    }

    // Validar y procesar `personal_id`
    if (personal_id !== undefined) {
      if (typeof personal_id !== "number") {
        errors.push("Tipo de dato inválido para 'personal_id'");
      } else {
        const [[personalExists]] = await pool.query(
          "SELECT COUNT(*) as count FROM personal WHERE id = ? AND isDeleted = 0",
          [personal_id]
        );
        if (personalExists.count === 0) {
          errors.push("Personal no encontrado");
        } else {
          updates.personal_id = personal_id;
        }
      }
    }

    // Validar y procesar `maquina_id`
    if (maquina_id !== undefined) {
      if (typeof maquina_id !== "number") {
        errors.push("Tipo de dato inválido para 'maquina_id'");
      } else {
        const [[maquinaExists]] = await pool.query(
          "SELECT COUNT(*) as count FROM maquina WHERE id = ? AND isDeleted = 0",
          [maquina_id]
        );
        if (maquinaExists.count === 0) {
          errors.push("Máquina no encontrada");
        } else {
          updates.maquina_id = maquina_id;
        }
      }
    }

    // Validar relación entre `personal_id` y `maquina_id`
    if (personal_id && maquina_id) {
      const [[relationExists]] = await pool.query(
        "SELECT COUNT(*) as count FROM conductor_maquina WHERE personal_id = ? AND maquina_id = ? AND isDeleted = 0",
        [personal_id, maquina_id]
      );
      if (relationExists.count > 0) {
        errors.push("El personal ya está asignado a esa máquina");
      }
    }

    // Validar y procesar `isDeleted`
    if (isDeleted !== undefined) {
      if (typeof isDeleted !== "number" || ![0, 1].includes(isDeleted)) {
        errors.push("Tipo de dato inválido para 'isDeleted'");
      } else {
        updates.isDeleted = isDeleted;
      }
    }

    // Verificar errores de validación
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Construir y ejecutar la consulta de actualización
    const updateKeys = Object.keys(updates);
    if (updateKeys.length === 0) {
      return res.status(400).json({
        message: "No se proporcionaron campos para actualizar",
      });
    }

    const setClause = updateKeys.map((key) => `${key} = ?`).join(", ");
    const values = [...Object.values(updates), idNumber];

    const [result] = await pool.query(
      `UPDATE conductor_maquina SET ${setClause} WHERE id = ? AND isDeleted = 0`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Conductor de máquina no encontrado" });
    }

    // Obtener y devolver el registro actualizado
    const [[updatedRecord]] = await pool.query(
      "SELECT * FROM conductor_maquina WHERE id = ?",
      [idNumber]
    );
    res.status(200).json(updatedRecord);
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      errors: [error.message],
    });
  }
};
