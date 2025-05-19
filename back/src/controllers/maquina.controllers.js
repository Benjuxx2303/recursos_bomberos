import { format } from "date-fns"; // Agregar esta importación
import { pool } from "../db.js";
import {
  uploadFileToS3
} from '../utils/fileUpload.js';

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
    const search = req.query.search || '';
    let { disponible, modelo_id, compania_id, codigo, patente, procedencia_id, personal_id } = req.query;

    // Aplicar filtro de compañía desde el middleware si existe y no hay un compania_id específico
    if (req.companyFilter) {
        compania_id = req.companyFilter;
    }

    let query = `
      SELECT DISTINCT
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
          LEFT JOIN personal per ON cm.personal_id = per.id
          WHERE cm.maquina_id = m.id AND cm.isDeleted = 0 AND per.isDeleted = 0
        ) as conductores
      FROM maquina m
      INNER JOIN modelo mo ON m.modelo_id = mo.id
      INNER JOIN tipo_maquina tm ON mo.tipo_maquina_id = tm.id
      INNER JOIN marca ma ON mo.marca_id = ma.id
      INNER JOIN compania c ON m.compania_id = c.id
      INNER JOIN procedencia p ON m.procedencia_id = p.id
      LEFT JOIN conductor_maquina cm ON m.id = cm.maquina_id
      WHERE m.isDeleted = 0
    `;
    const params = [];

    if (personal_id) {
      query += " AND cm.personal_id = ?";
      params.push(personal_id);
    }

    if (search) {
      query += " AND (m.patente LIKE ? OR m.codigo LIKE ? OR m.nombre LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (disponible !== undefined) {
      query += " AND m.disponible = ?";
      params.push(disponible);
    }
    if (modelo_id) {
      query += " AND m.modelo_id = ?";
      params.push(modelo_id);
    }
    if (compania_id) {
      // Mostrar siempre las maquinas de Comandancia para cualquier usuario
      query += " AND (m.compania_id = ? OR c.nombre = 'Comandancia')";
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
        // Aplicar filtro por personal si existe
    if (req.personalFilter) {
      query += ' AND personal_id = ?';
      params.push(req.personalFilter);       
    }

    if (!req.query.page) {
      query += " ORDER BY m.id DESC";
      const [rows] = await pool.query(query, params);
      const formattedRows = rows.map(formatDates);
      return res.json(formattedRows);
    }
    // Ajustar el conteo para la paginación (debe coincidir con el filtro principal)
    let countQuery = `SELECT COUNT(DISTINCT m.id) as total
      FROM maquina m
      INNER JOIN modelo mo ON m.modelo_id = mo.id
      INNER JOIN tipo_maquina tm ON mo.tipo_maquina_id = tm.id
      INNER JOIN marca ma ON mo.marca_id = ma.id
      INNER JOIN compania c ON m.compania_id = c.id
      INNER JOIN procedencia p ON m.procedencia_id = p.id
      LEFT JOIN conductor_maquina cm ON m.id = cm.maquina_id
      WHERE m.isDeleted = 0`;
    const countParams = [];
    if (personal_id) {
      countQuery += " AND cm.personal_id = ?";
      countParams.push(personal_id);
    }
    if (search) {
      countQuery += " AND (m.patente LIKE ? OR m.codigo LIKE ? OR m.nombre LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (disponible !== undefined) {
      countQuery += " AND m.disponible = ?";
      countParams.push(disponible);
    }
    if (modelo_id) {
      countQuery += " AND m.modelo_id = ?";
      countParams.push(modelo_id);
    }
    if (compania_id) {
      countQuery += " AND (m.compania_id = ? OR c.nombre = 'Comandancia')";
      countParams.push(compania_id);
    }
    if (codigo) {
      countQuery += " AND m.codigo LIKE ?";
      countParams.push(`%${codigo}%`);
    }
    if (patente) {
      countQuery += " AND m.patente LIKE ?";
      countParams.push(`%${patente}%`);
    }
    if (procedencia_id) {
      countQuery += " AND m.procedencia_id = ?";
      countParams.push(procedencia_id);
    }
    if (req.personalFilter) {
      countQuery += ' AND personal_id = ?';
      countParams.push(req.personalFilter);
    }
    const [countResult] = await pool.query(countQuery, countParams);
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
    // Primero obtenemos la información básica de la máquina
    const [machineRow] = await pool.query(`
      SELECT
        m.id AS id,
        m.disponible AS disponible,
        m.codigo AS codigo,
        m.patente AS patente,
        mo.id as modelo_id,
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
        m.img_rev_tecnica AS img_rev_tecnica,
        m.img_seguro AS img_seguro,
        m.img_permiso_circulacion AS img_permiso_circulacion,
        m.imgFrontal AS imgFrontal,
        m.imgLateralDerecha AS imgLateralDerecha,
        m.imgLateralIzquierda AS imgLateralIzquierda,
        m.imgTrasera AS imgTrasera
      FROM maquina m
      INNER JOIN modelo mo ON m.modelo_id = mo.id
      INNER JOIN tipo_maquina tm ON mo.tipo_maquina_id = tm.id
      INNER JOIN compania c ON m.compania_id = c.id
      INNER JOIN procedencia p ON m.procedencia_id = p.id
      WHERE m.id = ? AND m.isDeleted = 0
    `, [id]);

    if (machineRow.length <= 0) {
      return res.status(404).json({ message: "Máquina no encontrada" });
    }

    // Luego obtenemos los conductores en una consulta separada
    const [conductoresRow] = await pool.query(`
      SELECT 
        per.id,
        CONCAT(per.nombre, ' ', per.apellido) as nombre,
        per.rut
      FROM conductor_maquina cm
      JOIN personal per ON cm.personal_id = per.id
      WHERE cm.maquina_id = ? AND cm.isDeleted = 0 AND per.isDeleted = 0
    `, [id]);

    const formattedRow = {
      ...machineRow[0],
      ven_patente: machineRow[0].ven_patente ? format(new Date(machineRow[0].ven_patente), "dd-MM-yyyy") : null,
      ven_rev_tec: machineRow[0].ven_rev_tec ? format(new Date(machineRow[0].ven_rev_tec), "dd-MM-yyyy") : null,
      ven_seg_auto: machineRow[0].ven_seg_auto ? format(new Date(machineRow[0].ven_seg_auto), "dd-MM-yyyy") : null,
      conductores: conductoresRow
    };

    res.json(formattedRow);
  } catch (error) {
    console.error("Error en getMaquinaById:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// Crear nueva máquina
export const createMaquina = async (req, res) => {
  try {
    // Parsear los datos JSON si vienen en el campo 'data'
    const data = req.body.data ? JSON.parse(req.body.data) : req.body;
    
    console.log('Datos recibidos:', data);
    console.log('Valor de bomba recibido:', data.bomba, typeof data.bomba);

    // Asegurarse de que bomba sea un número
    data.bomba = Number(data.bomba);

    if (data.bomba !== 0 && data.bomba !== 1) {
      return res.status(400).json({
        errors: [{
          field: 'bomba',
          message: 'El campo "bomba" debe ser 0 o 1.'
        }]
      });
    }

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
    } = data;

    const errors = [];

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

    // Manejo de imágenes
    let img_url = null;
    let img_rev_tecnica = null;
    let img_seguro = null;
    let img_permiso_circulacion = null;
    let imgFrontal = null;
    let imgLateralDerecha = null;
    let imgLateralIzquierda = null;
    let imgTrasera = null;

    if (req.files) {
      const uploadImage = async (file, prefix) => {
        try {
          const imgData = await uploadFileToS3(file, `maquina/${prefix}`);
          return imgData?.Location || null;
        } catch (error) {
          errors.push(`Error al subir la imagen ${prefix}: ${error.message}`);
          return null;
        }
      };

      if (req.files.imagen) {
        img_url = await uploadImage(req.files.imagen[0], "perfil");
      }
      if (req.files.img_rev_tecnica) {
        img_rev_tecnica = await uploadImage(req.files.img_rev_tecnica[0], "rev_tecnica");
      }
      if (req.files.img_seguro) {
        img_seguro = await uploadImage(req.files.img_seguro[0], "seguro");
      }
      if (req.files.img_permiso_circulacion) {
        img_permiso_circulacion = await uploadImage(req.files.img_permiso_circulacion[0], "permiso");
      }
      if (req.files.imgFrontal) {
        imgFrontal = await uploadImage(req.files.imgFrontal[0], "frontal");
      }
      if (req.files.imgLateralDerecha) {
        imgLateralDerecha = await uploadImage(req.files.imgLateralDerecha[0], "lateral_derecha");
      }
      if (req.files.imgLateralIzquierda) {
        imgLateralIzquierda = await uploadImage(req.files.imgLateralIzquierda[0], "lateral_izquierda");
      }
      if (req.files.imgTrasera) {
        imgTrasera = await uploadImage(req.files.imgTrasera[0], "trasera");
      }
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
          ven_seg_auto, peso_kg, img_url, nombre, disponible, isDeleted, img_rev_tecnica, img_seguro, img_permiso_circulacion,
          imgFrontal, imgLateralDerecha, imgLateralIzquierda, imgTrasera
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, 
          STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?)`,
        [
          compania_id, modelo_id, codigo, patente, num_chasis, vin, bomba, hmetro_bomba,
          hmetro_motor, kmetraje, num_motor, ven_patente, procedencia_id, cost_rev_tec, ven_rev_tec, cost_seg_auto,
          ven_seg_auto, peso_kg, img_url, nombre, img_rev_tecnica, img_seguro, img_permiso_circulacion,
          imgFrontal, imgLateralDerecha, imgLateralIzquierda, imgTrasera
        ]
      );

      res.status(201).json({ 
        id: rows.insertId, 
        ...data, 
        img_url,
        img_rev_tecnica,
        img_seguro,
        img_permiso_circulacion
      });

    } catch (error) {
      errors.push({ message: "Error interno del servidor", error: error.message });
      return res.status(500).json({ errors });
    }
  } catch (error) {
    console.error("Error al crear máquina:", error);
    return res.status(500).json({ message: "Error al crear máquina", error: error.message });
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
    "img_rev_tecnica",
    "img_seguro",
    "img_permiso_circulacion"
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

    // Manejar la carga de imágenes
    if (req.files) {
      const uploadImage = async (file, prefix) => {
        try {
          const imgData = await uploadFileToS3(file, `maquina/${prefix}`);
          return imgData?.Location || null;
        } catch (error) {
          errors.push(`Error al subir la imagen ${prefix}: ${error.message}`);
          return null;
        }
      };

      // Manejar todas las imágenes posibles
      if (req.files.imagen) {
        updates.img_url = await uploadImage(req.files.imagen[0], "perfil");
      }
      if (req.files.img_rev_tecnica) {
        updates.img_rev_tecnica = await uploadImage(req.files.img_rev_tecnica[0], "rev_tecnica");
      }
      if (req.files.img_seguro) {
        updates.img_seguro = await uploadImage(req.files.img_seguro[0], "seguro");
      }
      if (req.files.img_permiso_circulacion) {
        updates.img_permiso_circulacion = await uploadImage(req.files.img_permiso_circulacion[0], "permiso");
      }
      if (req.files.imgFrontal) {
        updates.imgFrontal = await uploadImage(req.files.imgFrontal[0], "frontal");
      }
      if (req.files.imgLateralDerecha) {
        updates.imgLateralDerecha = await uploadImage(req.files.imgLateralDerecha[0], "lateral_derecha");
      }
      if (req.files.imgLateralIzquierda) {
        updates.imgLateralIzquierda = await uploadImage(req.files.imgLateralIzquierda[0], "lateral_izquierda");
      }
      if (req.files.imgTrasera) {
        updates.imgTrasera = await uploadImage(req.files.imgTrasera[0], "trasera");
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
/*       if (conductor[0].compania_id !== compania_id_maquina) {
        return res.status(400).json({
          message: `El conductor con ID ${conductor_id} no pertenece a la misma compañía que la máquina`,
        });
      } */

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

// Verificar estado de mantención
export const verificarEstadoMantencion = async () => {
  try {
    const [rows] = await pool.query("SELECT id, ven_rev_tec FROM maquina WHERE isDeleted = 0");
    const hoy = new Date();

    for (const maquina of rows) {
      const fechaRevTec = new Date(maquina.ven_rev_tec);
      
      // Comparar la fecha de revisión técnica con la fecha actual
      if (fechaRevTec <= hoy) {
        await pool.query("UPDATE maquina SET disponible = 0 WHERE id = ?", [maquina.id]);
        console.log(`Máquina con ID ${maquina.id} marcada como no disponible.`);
      }

      // TODO: Envíar correo a los maquinistas y altos mandos. (Por si acaso o si es que)
    }
  } catch (error) {
    console.error("Error al verificar estado de mantención:", error);
  }
};

// Verificar estado de permiso de circulación
export const verificarEstadoPermisoCirculacion = async () => {
  try {
    const [rows] = await pool.query("SELECT id, ven_permiso_circulacion FROM maquina WHERE isDeleted = 0");
    const hoy = new Date();

    for (const maquina of rows) {
      const fechaPermisoCirculacion = maquina.ven_permiso_circulacion ? new Date(maquina.ven_permiso_circulacion) : null;
      
      // Verificar si la fecha de permiso de circulación es válida (no es null)
      if (fechaPermisoCirculacion && fechaPermisoCirculacion <= hoy) {
        await pool.query("UPDATE maquina SET disponible = 0 WHERE id = ?", [maquina.id]);
        console.log(`Máquina con ID ${maquina.id} marcada como Fuera de Servicio.`);
      } else if (!fechaPermisoCirculacion) {
        // Si la fecha de permiso es null, manejar el caso como corresponda
        console.log(`Máquina con ID ${maquina.id} no tiene permiso de circulación asignado.`);
        // Aquí puedes agregar cualquier lógica adicional, por ejemplo, marcarla como fuera de servicio o ignorarla
        // await pool.query("UPDATE maquina SET disponible = 0 WHERE id = ?", [maquina.id]); // Si lo deseas
      }
    }
  } catch (error) {
    console.error("Error al verificar estado de permiso de circulación:", error);
  }
};