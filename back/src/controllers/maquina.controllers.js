import { format } from "date-fns"; // Agregar esta importación
import { pool } from "../db.js";
import {
  uploadFileToS3
} from '../utils/fileUpload.js';

// Obtener todas las máquinas
export const getMaquinas = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM maquina WHERE isDeleted = 0");
    res.json(rows);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Obtener detalles de las máquinas
export const getMaquinasDetails = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        m.id AS maquina_id,
        m.disponible AS disponible,
        m.codigo AS codigo,
        m.patente AS patente,
        m.num_chasis AS num_chasis,
        m.vin AS vin,
        m.bomba AS bomba,
        m.hmetro_bomba AS hmetro_bomba,
        m.hmetro_motor AS hmetro_motor,
        m.kmetraje AS kmetraje,
        m.num_motor AS num_motor,
        m.peso_kg AS peso_kg,
        DATE_FORMAT(m.ven_patente, '%d-%m-%Y') AS ven_patente,
        m.cost_rev_tec AS cost_rev_tec,
        DATE_FORMAT(m.ven_rev_tec, '%d-%m-%Y') AS ven_rev_tec,
        m.cost_seg_auto AS cost_seg_auto,
        DATE_FORMAT(m.ven_seg_auto, '%d-%m-%Y') AS ven_seg_auto,
        mo.nombre AS modelo,
        tm.nombre AS tipo_maquina,
        c.nombre AS compania,
        p.nombre AS procedencia,
        m.img_url AS img_url
      FROM maquina m
      INNER JOIN modelo mo ON m.modelo_id = mo.id
      INNER JOIN tipo_maquina tm ON mo.tipo_maquina_id = tm.id
      INNER JOIN compania c ON m.compania_id = c.id
      INNER JOIN procedencia p ON m.procedencia_id = p.id
      WHERE m.isDeleted = 0
    `);
    res.json(rows);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Obtener detalles de las máquinas con paginación
export const getMaquinasDetailsPage = async (req, res) => {
  try {
    const formatDates = (row) => {
      try {
        return {
          ...row,
          ven_patente: row.ven_patente ? format(new Date(row.ven_patente), "dd-MM-yyyy") : null,
          ven_rev_tec: row.ven_rev_tec ? format(new Date(row.ven_rev_tec), "dd-MM-yyyy") : null,
          ven_seg_auto: row.ven_seg_auto ? format(new Date(row.ven_seg_auto), "dd-MM-yyyy") : null,
          conductores: row.conductores ? JSON.parse(`[${row.conductores}]`) : [],
        };
      } catch (err) {
        console.error("Error procesando fila:", err);
        return row;
      }
    };

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    let { disponible, modelo_id, compania_id, codigo, patente, procedencia_id } = req.query;

    let query = `
      SELECT
        m.*,
        tm.nombre AS tipo_maquina,
        c.id AS compania_id,
        c.nombre AS compania,
        p.nombre AS procedencia,
        mo.nombre AS modelo,
        mo.id AS modelo_id,
        tm.id AS tipo_maquina_id,
        tm.nombre AS tipo_maquina,
        ma.nombre AS marca,
        (
          SELECT GROUP_CONCAT(
            JSON_OBJECT(
              'id', per.id,
              'nombre', CONCAT(per.nombre, ' ', per.apellido),
              'rut', per.rut
            )
          )
          FROM conductor_maquina cm
          JOIN personal per ON cm.personal_id = per.id
          WHERE cm.maquina_id = m.id AND cm.isDeleted = 0 AND per.isDeleted = 0
        ) as conductores
      FROM maquina m
      INNER JOIN modelo mo ON m.modelo_id = mo.id
      INNER JOIN tipo_maquina tm ON mo.tipo_maquina_id = tm.id
      INNER JOIN marca ma ON mo.marca_id = ma.id
      INNER JOIN compania c ON m.compania_id = c.id
      INNER JOIN procedencia p ON m.procedencia_id = p.id
      WHERE m.isDeleted = 0
    `;
    const params = [];

    if (disponible !== undefined) {
      query += " AND m.disponible = ?";
      params.push(disponible);
    }
    if (modelo_id) {
      query += " AND m.modelo_id = ?";
      params.push(modelo_id);
    }
    if (compania_id) {
      query += " AND m.compania_id = ?";
      params.push(compania_id);
    }
    if (codigo) {
      query += " AND m.codigo LIKE ?";
      params.push(`%${codigo}%`);
    }
    if (patente) {
      query += " AND m.patente LIKE ?";
      params.push(`%${patente}%`);
    }
    if (procedencia_id) {
      query += " AND m.procedencia_id = ?";
      params.push(procedencia_id);
    }

    if (!req.query.page) {
      query += " ORDER BY m.id DESC";
      const [rows] = await pool.query(query, params);
      const formattedRows = rows.map(formatDates);
      return res.json(formattedRows);
    }

    const [countResult] = await pool.query("SELECT COUNT(*) as total FROM maquina WHERE isDeleted = 0");
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / pageSize);

    query += " ORDER BY m.id DESC LIMIT ? OFFSET ?";
    params.push(pageSize, (page - 1) * pageSize);

    const [rows] = await pool.query(query, params);
    const formattedRows = rows.map(formatDates);

    res.json({
      formattedRows,
      totalRecords,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error en getMaquinasDetailsPage: ", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener máquina por ID
export const getMaquinaById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT
        m.id AS id,
        m.disponible AS disponible,
        m.codigo AS codigo,
        m.patente AS patente,
        m.num_chasis AS num_chasis,
        m.vin AS vin,
        m.bomba AS bomba,
        m.hmetro_bomba AS hmetro_bomba,
        m.hmetro_motor AS hmetro_motor,
        m.kmetraje AS kmetraje,
        m.num_motor AS num_motor,
        m.ven_patente AS ven_patente,
        m.cost_rev_tec AS cost_rev_tec,
        m.ven_rev_tec AS ven_rev_tec,
        m.cost_seg_auto AS cost_seg_auto,
        DATE_FORMAT(m.ven_seg_auto, '%d-%m-%Y') AS ven_seg_auto,
        m.ven_seg_auto AS ven_seg_auto,
        m.peso_kg AS peso_kg,
        mo.tipo_maquina_id AS tipo_maquina_id,
        tm.nombre AS tipo_maquina,
        c.id AS compania_id,
        c.nombre AS compania,
        p.nombre AS procedencia,
        m.img_url AS img_url,
        (
          SELECT GROUP_CONCAT(
            JSON_OBJECT(
              'id', per.id,
              'nombre', CONCAT(per.nombre, ' ', per.apellido)
            )
          )
          FROM conductor_maquina cm
          JOIN personal per ON cm.personal_id = per.id
          WHERE cm.maquina_id = m.id AND cm.isDeleted = 0 AND per.isDeleted = 0
        ) as conductores
      FROM maquina m
      INNER JOIN modelo mo ON m.modelo_id = mo.id
      INNER JOIN tipo_maquina tm ON mo.tipo_maquina_id = tm.id
      INNER JOIN compania c ON m.compania_id = c.id
      INNER JOIN procedencia p ON m.procedencia_id = p.id
      WHERE m.id = ? AND m.isDeleted = 0
    `, [id]);

    if (rows.length <= 0) {
      return res.status(404).json({ message: "Máquina no encontrada" });
    }

    const formattedRow = {
      ...rows[0],
      ven_patente: rows[0].ven_patente ? format(new Date(rows[0].ven_patente), "dd-MM-yyyy") : null,
      ven_rev_tec: rows[0].ven_rev_tec ? format(new Date(rows[0].ven_rev_tec), "dd-MM-yyyy") : null,
      ven_seg_auto: rows[0].ven_seg_auto ? format(new Date(rows[0].ven_seg_auto), "dd-MM-yyyy") : null,
      conductores: rows[0].conductores ? JSON.parse(`[${rows[0].conductores}]`) : []
    };

    res.json(formattedRow);
  } catch (error) {
    console.error("Error en getMaquinaById:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// Crear nueva máquina
export const createMaquina = async (req, res) => {
  let {
    compania_id,
    modelo_id,
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
    peso_kg,
    nombre,
  } = req.body;

  const errors = []; // Arreglo para almacenar errores

  // Validación genérica para números y cadenas
  const validateField = (value, type, field) => {
    if (type === 'number' && isNaN(value)) {
      errors.push({ field, message: `El campo "${field}" debe ser un número.` });
    } else if (type === 'string' && typeof value !== 'string') {
      errors.push({ field, message: `El campo "${field}" debe ser una cadena de texto.` });
    } else if (type === 'decimal' && isNaN(parseFloat(value))) {
      errors.push({ field, message: `El campo "${field}" debe ser un número decimal.` });
    }
  };

  // Validación de campos
  const fieldsToValidate = [
    { value: compania_id, type: 'number', field: 'compania_id' },
    { value: modelo_id, type: 'number', field: 'modelo_id' },
    { value: codigo, type: 'string', field: 'codigo' },
    { value: nombre, type: 'string', field: 'nombre' },
    { value: patente, type: 'string', field: 'patente' },
    { value: num_chasis, type: 'string', field: 'num_chasis' },
    { value: vin, type: 'string', field: 'vin' },
    { value: cost_rev_tec, type: 'decimal', field: 'cost_rev_tec' },
    { value: cost_seg_auto, type: 'decimal', field: 'cost_seg_auto' },
    { value: peso_kg, type: 'number', field: 'peso_kg' },
    { value: bomba, type: 'number', field: 'bomba' },
  ];

  fieldsToValidate.forEach(({ value, type, field }) => validateField(value, type, field));

  // Validación de fechas
  const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
  const fechas = [
    { field: 'ven_patente', value: ven_patente },
    { field: 'ven_rev_tec', value: ven_rev_tec },
    { field: 'ven_seg_auto', value: ven_seg_auto }
  ];
  
  fechas.forEach(({ field, value }) => {
    if (value && !fechaRegex.test(value)) {
      errors.push({ field, message: `El formato de fecha en el campo ${field} es inválido. Debe ser dd-mm-aaaa.` });
    }
  });

  // Validación de existencia en base de datos
  const validateExists = async (field, table, id) => {
    const [result] = await pool.query(`SELECT * FROM ${table} WHERE id = ? AND isDeleted = 0`, [id]);
    if (result.length === 0) {
      errors.push({ field, message: `El ${field} con el ID proporcionado no existe o está eliminado.` });
    }
  };

  await Promise.all([
    validateExists('compania_id', 'compania', compania_id),
    validateExists('procedencia_id', 'procedencia', procedencia_id),
    validateExists('modelo_id', 'modelo', modelo_id)
  ]);

  // Verificar patente duplicada
  const [patenteExists] = await pool.query("SELECT * FROM maquina WHERE patente = ? AND isDeleted = 0", [patente]);
  if (patenteExists.length > 0) {
    errors.push({ field: 'patente', message: 'Ya existe una máquina con la patente proporcionada.' });
  }

  // Manejo de imagen
  let img_url = null;
  if (req.files && req.files.imagen) {
    const imagen = req.files.imagen[0];
    try {
      const imgData = await uploadFileToS3(imagen, "maquina");
      if (imgData && imgData.Location) {
        img_url = imgData.Location;
      } else {
        errors.push("No se pudo obtener la URL de la imagen");
      }
    } catch (error) {
      errors.push("Error al subir la imagen", error.message);
    }
  }

  // Validación de bomba
  if (bomba !== 0 && bomba !== 1) {
    errors.push({ field: 'bomba', message: 'El campo "bomba" debe ser 0 o 1.' });
  }

  // Si hay errores, devolverlos antes de continuar
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // Inserción en la base de datos
    const [rows] = await pool.query(
      `INSERT INTO maquina (
        compania_id, modelo_id, codigo, patente, num_chasis, vin, bomba, hmetro_bomba,
        hmetro_motor, kmetraje, num_motor, ven_patente, procedencia_id, cost_rev_tec, ven_rev_tec, cost_seg_auto,
        ven_seg_auto, peso_kg, img_url, nombre, disponible, isDeleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, ?, 1, 0)`,
      [
        compania_id, modelo_id, codigo, patente, num_chasis, vin, bomba, hmetro_bomba,
        hmetro_motor, kmetraje, num_motor, ven_patente, procedencia_id, cost_rev_tec, ven_rev_tec, cost_seg_auto,
        ven_seg_auto, peso_kg, img_url, nombre
      ]
    );

    res.status(201).json({ id: rows.insertId, ...req.body });

  } catch (error) {
    errors.push({ message: "Error interno del servidor", error: error.message });
    return res.status(500).json({ errors });
  }
};

// Eliminar máquina (cambiar estado)
export const deleteMaquina = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "UPDATE maquina SET isDeleted = 1, disponible = 0 WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Máquina no encontrada" });
    res.status(204).end();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Actualizar máquina
export const updateMaquina = async (req, res) => {
  const { id } = req.params;
  const errors = [];
  const updates = {};

  // Lista de campos permitidos para actualización
  const allowedFields = [
    "compania_id",
    "modelo_id",
    "codigo",
    "nombre",
    "patente",
    "num_chasis",
    "vin",
    "bomba",
    "hmetro_bomba",
    "hmetro_motor",
    "kmetraje",
    "num_motor",
    "ven_patente",
    "procedencia_id",
    "cost_rev_tec",
    "ven_rev_tec",
    "cost_seg_auto",
    "ven_seg_auto",
    "disponible",
    "peso_kg",
    "isDeleted",
    "img_url",
  ];

  // Función para convertir fechas de dd-mm-yyyy a yyyy-mm-dd
  const convertirFecha = (fecha) => {
    const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    if (fechaRegex.test(fecha)) {
      const [dia, mes, anio] = fecha.split("-");
      return `${anio}-${mes}-${dia}`;
    }
    return null;
  };

  try {
    // Validar el ID
    const idNumber = parseInt(id, 10);
    if (isNaN(idNumber)) {
      return res.status(400).json({ message: "ID inválido", errors: ["ID debe ser un número válido."] });
    }

    // Manejar la carga de imágenes si existen
    if (req.files && req.files.imagen) {
      try {
        const imgData = await uploadFileToS3(req.files.imagen[0], "maquina");
        if (imgData && imgData.Location) {
          updates.img_url = imgData.Location; // Guardar URL de la imagen
        } else {
          errors.push("No se pudo obtener la URL de la imagen.");
        }
      } catch (error) {
        errors.push(`Error al subir la imagen: ${error.message}`);
      }
    }

    // Validar y asignar campos del cuerpo de la solicitud
    for (const field of Object.keys(req.body)) {
      if (allowedFields.includes(field)) {
        let value = req.body[field];

        // Convertir fechas al formato MySQL si es necesario
        if (["ven_patente", "ven_rev_tec", "ven_seg_auto"].includes(field)) {
          const fechaConvertida = convertirFecha(value);
          if (!fechaConvertida) {
            errors.push(`Formato de fecha inválido para ${field}. Debe ser dd-mm-yyyy.`);
            continue;
          }
          value = fechaConvertida;
        }

        // Validar valores numéricos
        if (["bomba", "disponible", "isDeleted"].includes(field)) {
          value = parseInt(value, 10);
          if (isNaN(value) || (value !== 0 && value !== 1)) {
            errors.push(`${field} debe ser 0 o 1.`);
            continue;
          }
        }

        if (["hmetro_bomba", "hmetro_motor", "kmetraje", "cost_rev_tec", "cost_seg_auto", "peso_kg"].includes(field)) {
          value = parseFloat(value);
          if (isNaN(value)) {
            errors.push(`${field} debe ser un número válido.`);
            continue;
          }
        }

        // Agregar campo validado a las actualizaciones
        updates[field] = value;
      } else {
        errors.push(`El campo '${field}' no está permitido.`);
      }
    }

    // Manejar errores de validación
    if (errors.length > 0) {
      return res.status(400).json({ message: "Errores de validación", errors });
    }

    // Verificar que haya algo que actualizar
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No se proporcionaron campos válidos para actualizar." });
    }

    // Construir consulta de actualización dinámica
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates).concat(idNumber);

    // Ejecutar actualización en la base de datos
    const [result] = await pool.query(`UPDATE maquina SET ${setClause} WHERE id = ?`, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Máquina no encontrada o no se pudo actualizar." });
    }

    // Obtener máquina actualizada
    const [updatedMachine] = await pool.query("SELECT * FROM maquina WHERE id = ?", [idNumber]);
    res.json(updatedMachine[0]);
  } catch (error) {
    console.error("Error al actualizar máquina:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};


// Asignar conductores
export const asignarConductores = async (req, res) => {
  const { maquina_id, conductores } = req.body;

  try {
    // Validar que se recibieron los datos necesarios
    if (
      !maquina_id ||
      !conductores ||
      !Array.isArray(conductores) ||
      conductores.length === 0
    ) {
      return res.status(400).json({
        message:
          "Datos inválidos. Se requiere maquina_id y un array de conductores",
      });
    }

    // Obtener información de la máquina
    const [maquina] = await pool.query(
      "SELECT id, compania_id FROM maquina WHERE id = ? AND isDeleted = 0",
      [maquina_id]
    );

    if (maquina.length === 0) {
      return res.status(404).json({
        message: "La máquina especificada no existe o está eliminada",
      });
    }

    const compania_id_maquina = maquina[0].compania_id;

    // Validar cada conductor
    for (const conductor_id of conductores) {
      // Verificar que el conductor existe y obtener su compañía
      const [conductor] = await pool.query(
        "SELECT id, compania_id FROM personal WHERE id = ? AND isDeleted = 0",
        [conductor_id]
      );

      if (conductor.length === 0) {
        return res.status(404).json({
          message: `El conductor con ID ${conductor_id} no existe o está eliminado`,
        });
      }

      // Validar que pertenecen a la misma compañía
      if (conductor[0].compania_id !== compania_id_maquina) {
        return res.status(400).json({
          message: `El conductor con ID ${conductor_id} no pertenece a la misma compañía que la máquina`,
        });
      }

      // Verificar si ya existe la asignación
      const [existeAsignacion] = await pool.query(
        "SELECT id FROM conductor_maquina WHERE personal_id = ? AND maquina_id = ? AND isDeleted = 0",
        [conductor_id, maquina_id]
      );

      if (existeAsignacion.length > 0) {
        return res.status(400).json({
          message: `El conductor con ID ${conductor_id} ya está asignado a esta máquina`,
        });
      }
    }

    // Realizar las asignaciones
    for (const conductor_id of conductores) {
      await pool.query(
        "INSERT INTO conductor_maquina (personal_id, maquina_id, isDeleted) VALUES (?, ?, 0)",
        [conductor_id, maquina_id]
      );
    }

    return res.status(201).json({
      message: "Conductores asignados exitosamente",
      data: {
        maquina_id,
        conductores_asignados: conductores,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al asignar conductores",
      error: error.message,
    });
  }
};

// Activar máquina por patente
export const activarMaquinaPorPatente = async (req, res) => {
  const { patente } = req.params; // Obtener la patente de los parámetros
  try {
    const [result] = await pool.query(
      "UPDATE maquina SET disponible = 1 WHERE patente = ? AND isDeleted = 0",
      [patente]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Máquina no encontrada o ya está activa" });
    }
    res.status(200).json({ message: "Máquina activada con éxito" });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};