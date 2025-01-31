import { pool } from "../db.js";
import { exportToExcel } from "../utils/excelExport.js";
import { uploadFileToS3 } from "../utils/fileUpload.js";
import { createAndSendNotifications, getNotificationUsers } from '../utils/notifications.js';
import { validateFloat } from "../utils/validations.js";

export const getMantencionesAllDetails = async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT
                m.id,
                b.id AS 'bitacora.id',
                c.nombre AS 'bitacora.compania', -- Nombre de la compañia
                CONCAT(p.rut) AS 'bitacora.conductor', -- RUT del conductor
                b.direccion AS 'bitacora.direccion',
                DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS 'bitacora.h_salida',
                DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS 'bitacora.h_llegada',
                b.km_salida AS 'bitacora.km_salida',
                b.km_llegada AS 'bitacora.km_llegada',
                b.hmetro_salida AS 'bitacora.hmetro_salida',
                b.hmetro_llegada AS 'bitacora.hmetro_llegada',
                b.hbomba_salida AS 'bitacora.hbomba_salida',
                b.hbomba_llegada AS 'bitacora.hbomba_llegada',
                b.obs AS 'bitacora.obs',
                ma.patente AS 'patente',
                DATE_FORMAT(m.fec_inicio, '%d-%m-%Y') AS 'fec_inicio',
                DATE_FORMAT(m.fec_termino, '%d-%m-%Y') AS 'fec_termino',
                m.ord_trabajo,
                m.n_factura,
                m.img_url,
                m.cost_ser,
                t.nombre AS 'taller',
                em.nombre AS 'estado_mantencion',
                tm.nombre AS 'tipo_mantencion'
            FROM mantencion m
            INNER JOIN bitacora b ON m.bitacora_id = b.id
            INNER JOIN compania c ON b.compania_id = c.id
            INNER JOIN maquina ma ON m.maquina_id = ma.id
            INNER JOIN personal p ON b.personal_id = p.id
            INNER JOIN taller t ON m.taller_id = t.id
            INNER JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            INNER JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
            WHERE m.isDeleted = 0 AND b.isDeleted = 0
        `);

    const result = rows.map((row) => ({
      id: row.id,
      bitacora: {
        id: row["bitacora.id"],
        compania: row["bitacora.compania"],
        conductor: row["bitacora.conductor"],
        direccion: row["bitacora.direccion"],
        h_salida: row["bitacora.h_salida"],
        h_llegada: row["bitacora.h_llegada"],
        km_salida: row["bitacora.km_salida"],
        km_llegada: row["bitacora.km_llegada"],
        hmetro_salida: row["bitacora.hmetro_salida"],
        hmetro_llegada: row["bitacora.hmetro_llegada"],
        hbomba_salida: row["bitacora.hbomba_salida"],
        hbomba_llegada: row["bitacora.hbomba_llegada"],
        obs: row["bitacora.obs"],
      },
      patente: row.patente,
      fec_inicio: row.fec_i,
      fec_termino: row.fec_termino,
      ord_trabajo: row.ord_trabajo,
      n_factura: row.n_factura,
      img_url: row.img_url,
      cost_ser: row.cost_ser,
      taller: row.taller,
      estado_mantencion: row.estado_mantencion,
      tipo_mantencion_id: row.tipo_mantencion_id,
    }));

    res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// con parámetros de búsqueda
// Paginacion
export const getMantencionesAllDetailsSearch = async (req, res) => {
  try {
    const { taller, estado_mantencion, ord_trabajo, compania, page, pageSize } =
      req.query;

    // Inicializar la consulta SQL base
    let query = `
            SELECT
                m.id,
                b.id AS 'bitacora.id',
                c.nombre AS 'bitacora.compania', -- Nombre de la compañia
                CONCAT(p.rut) AS 'bitacora.conductor', -- RUT del conductor
                b.direccion AS 'bitacora.direccion',
                DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS 'bitacora.fh_salida',
                DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS 'bitacora.fh_llegada',
                b.km_salida AS 'bitacora.km_salida',
                b.km_llegada AS 'bitacora.km_llegada',
                b.hmetro_salida AS 'bitacora.hmetro_salida',
                b.hmetro_llegada AS 'bitacora.hmetro_llegada',
                b.hbomba_salida AS 'bitacora.hbomba_salida',
                b.hbomba_llegada AS 'bitacora.hbomba_llegada',
                b.obs AS 'bitacora.obs',
                ma.patente AS 'patente',
                DATE_FORMAT(m.fec_inicio, '%d-%m-%Y') AS 'fec_inicio',
                DATE_FORMAT(m.fec_termino, '%d-%m-%Y') AS 'fec_termino',
                m.ord_trabajo,
                m.n_factura,
                m.img_url,
                m.cost_ser,
                t.razon_social AS 'taller',
                em.nombre AS 'estado_mantencion',
                tm.nombre AS 'tipo_mantencion',
                tm.id AS 'tipo_mantencion_id'
            FROM mantencion m
            INNER JOIN bitacora b ON m.bitacora_id = b.id
            INNER JOIN compania c ON b.compania_id = c.id
            INNER JOIN maquina ma ON m.maquina_id = ma.id
            INNER JOIN personal p ON b.personal_id = p.id
            INNER JOIN taller t ON m.taller_id = t.id
            INNER JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            INNER JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
            WHERE m.isDeleted = 0 AND b.isDeleted = 0
        `;

    // Array para almacenar los parámetros a inyectar
    const params = [];

    if (taller) {
      query += " AND t.razon_social = ?";
      params.push(taller);
    }
    if (estado_mantencion) {
      query += " AND em.nombre = ?";
      params.push(estado_mantencion);
    }
    if (ord_trabajo) {
      query += " AND m.ord_trabajo = ?";
      params.push(ord_trabajo);
    }
    if (compania) {
      query += " AND c.nombre = ?";
      params.push(compania);
    }

    // Si se proporciona "page", se aplica paginación
    if (page) {
      const currentPage = parseInt(page) || 1; // Página actual, por defecto 1
      const currentPageSize = parseInt(pageSize) || 10; // Página tamaño, por defecto 10
      const offset = (currentPage - 1) * currentPageSize; // Calcular el offset para la consulta

      // Añadir LIMIT y OFFSET a la consulta
      query += " LIMIT ? OFFSET ?";
      params.push(currentPageSize, offset);
    }

    query += " ORDER BY m.id DESC";

    // Ejecutar la consulta con los parámetros
    const [rows] = await pool.query(query, params);

    // Mapeo de resultados a la estructura deseada
    const result = rows.map((row) => ({
      id: row.id,
      "bitacora.id": row["bitacora.id"],
      "bitacora.compania": row["bitacora.compania"],
      "bitacora.conductor": row["bitacora.conductor"],
      "bitacora.direccion": row["bitacora.direccion"],
      "bitacora.fh_salida": row["bitacora.fh_salida"],
      "bitacora.fh_llegada": row["bitacora.fh_llegada"],
      "bitacora.km_salida": row["bitacora.km_salida"],
      "bitacora.km_llegada": row["bitacora.km_llegada"],
      "bitacora.hmetro_salida": row["bitacora.hmetro_salida"],
      "bitacora.hmetro_llegada": row["bitacora.hmetro_llegada"],
      "bitacora.hbomba_salida": row["bitacora.hbomba_salida"],
      "bitacora.hbomba_llegada": row["bitacora.hbomba_llegada"],
      "bitacora.obs": row["bitacora.obs"],
      patente: row.patente,
      fec_inicio: row.fec_inicio,
      fec_termino: row.fec_termino,
      ord_trabajo: row.ord_trabajo,
      n_factura: row.n_factura,
      img_url: row.img_url,
      cost_ser: row.cost_ser,
      taller: row.taller,
      estado_mantencion: row.estado_mantencion,
      tipo_mantencion: row.tipo_mantencion,
      tipo_mantencion_id: row.tipo_mantencion_id,
    }));

    // Responder con los resultados formateados
    res.json(result);
  } catch (error) {
    console.error("Error: ", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// TODO: actualizar
export const getMantencionAllDetailsById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `
            SELECT
                m.id,
                b.id AS 'bitacora.id',
                c.nombre AS 'bitacora.compania', -- Nombre de la compañia
                CONCAT(p.rut) AS 'bitacora.conductor', -- RUT del conductor
                b.direccion AS 'bitacora.direccion',
                DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS 'bitacora.h_salida',
                DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS 'bitacora.h_llegada',
                b.km_salida AS 'bitacora.km_salida',
                b.km_llegada AS 'bitacora.km_llegada',
                b.hmetro_salida AS 'bitacora.hmetro_salida',
                b.hmetro_llegada AS 'bitacora.hmetro_llegada',
                b.hbomba_salida AS 'bitacora.hbomba_salida',
                b.hbomba_llegada AS 'bitacora.hbomba_llegada',
                b.obs AS 'bitacora.obs',
                ma.img_url AS 'img_url',
                ma.patente AS 'patente',    
                ma.nombre AS 'maquina.nombre',
                DATE_FORMAT(m.fec_inicio, '%d-%m-%Y') AS 'fec_inicio',
                DATE_FORMAT(m.fec_termino, '%d-%m-%Y') AS 'fec_termino',
                m.ord_trabajo,
                m.n_factura,
                m.cost_ser,
                m.aprobada,
                t.razon_social AS 'taller',
                em.nombre AS 'estado_mantencion',
                tm.nombre AS 'tipo_mantencion'
            FROM mantencion m
            INNER JOIN bitacora b ON m.bitacora_id = b.id
            INNER JOIN compania c ON b.compania_id = c.id
            INNER JOIN maquina ma ON m.maquina_id = ma.id
            INNER JOIN personal p ON b.personal_id = p.id
            INNER JOIN taller t ON m.taller_id = t.id
            INNER JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            INNER JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
            WHERE m.isDeleted = 0 AND b.isDeleted = 0 AND m.id = ?
        `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Mantención no encontrada" });
    }

    const result = rows.map((row) => ({
      id: row.id,
      "bitacora.id": row["bitacora.id"],
      "bitacora.compania": row["bitacora.compania"],
      "bitacora.conductor": row["bitacora.conductor"],
      "bitacora.direccion": row["bitacora.direccion"],
      "bitacora.fh_salida": row["bitacora.fh_salida"],
      "bitacora.fh_llegada": row["bitacora.fh_llegada"],
      "bitacora.km_salida": row["bitacora.km_salida"],
      "bitacora.km_llegada": row["bitacora.km_llegada"],
      "bitacora.hmetro_salida": row["bitacora.hmetro_salida"],
      "bitacora.hmetro_llegada": row["bitacora.hmetro_llegada"],
      "bitacora.hbomba_salida": row["bitacora.hbomba_salida"],
      "bitacora.hbomba_llegada": row["bitacora.hbomba_llegada"],
      "bitacora.obs": row["bitacora.obs"],
      patente: row.patente,
      fec_inicio: row.fec_inicio,
      fec_termino: row.fec_termino,
      ord_trabajo: row.ord_trabajo,
      n_factura: row.n_factura,
      cost_ser: row.cost_ser,
      aprobada: row.aprobada,
      taller: row.taller,
      img_url: row.img_url,
      estado_mantencion: row.estado_mantencion,
      tipo_mantencion: row.tipo_mantencion,
      tipo_mantencion_id: row.tipo_mantencion_id,
    }));

    res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Crear una nueva mantención
export const createMantencion = async (req, res) => {
  try {
    const {
      bitacora_id,
      maquina_id,
      taller_id,
      tipo_mantencion_id,
      fec_inicio,
      fec_termino,
      ord_trabajo,
      n_factura,
      cost_ser,
      aprobada,
    } = req.body;

    let errors = [];
    const estado_mantencion_id = 1;

    // Validaciones de entrada
    const validateId = (id, fieldName) => isNaN(parseInt(id)) && errors.push(`El ID de ${fieldName} es inválido`);
    validateId(bitacora_id, 'bitácora');
    validateId(maquina_id, 'máquina');
    validateId(taller_id, 'taller');
    validateId(tipo_mantencion_id, 'tipo de mantención');

    if (typeof ord_trabajo !== 'string') errors.push("El número de orden de trabajo debe ser una cadena de texto");
    if (n_factura && isNaN(parseInt(n_factura))) errors.push("El número de factura es inválido");
    if (cost_ser && isNaN(parseFloat(cost_ser))) errors.push("El costo del servicio es inválido");

    // Validación de fechas
    const isValidDate = dateStr => /^\d{2}-\d{2}-\d{4}$/.test(dateStr);
    if (fec_inicio && !isValidDate(fec_inicio)) errors.push("El formato de la fecha de inicio es inválido. Debe ser dd-mm-yyyy");
    if (fec_termino && !isValidDate(fec_termino)) errors.push("El formato de la fecha de término es inválido. Debe ser dd-mm-yyyy");

    if (errors.length > 0) return res.status(400).json({ message: "Errores en los datos de entrada", errors });

    // Convertir a números para evitar redundancia en el código
    const bitacoraIdNumber = parseInt(bitacora_id);
    const maquinaIdNumber = parseInt(maquina_id);
    const tallerIdNumber = parseInt(taller_id);
    const tipoMantencionIdNumber = parseInt(tipo_mantencion_id);
    const costSerNumber = parseFloat(cost_ser);

    // Validar existencia de la bitácora
    const [bitacoraInfo] = await pool.query(
      `SELECT b.id, b.personal_id, m.codigo, m.compania_id, c.nombre as compania_nombre
       FROM bitacora b 
       INNER JOIN maquina m ON b.maquina_id = m.id 
       INNER JOIN compania c ON m.compania_id = c.id
       WHERE b.id = ? AND b.isDeleted = 0`, 
      [bitacoraIdNumber]
    );

    if (!bitacoraInfo.length) return res.status(400).json({ message: "Bitácora no existe o está eliminada" });

    const { codigo, compania_id } = bitacoraInfo[0];

    // Verificar si ya existe una mantención o carga de combustible asociada
    const [mantencionExistente] = await pool.query(
      "SELECT 1 FROM mantencion WHERE bitacora_id = ? AND isDeleted = 0",
      [bitacoraIdNumber]
    );

    const [cargaExistente] = await pool.query(
      "SELECT 1 FROM carga_combustible WHERE bitacora_id = ? AND isDeleted = 0",
      [bitacoraIdNumber]
    );

    if (mantencionExistente.length || cargaExistente.length) {
      return res.status(400).json({ message: "Ya existe un servicio asociado a esta bitácora" });
    }

    // Manejar la carga de imagen si existe
    let img_url = null;
    if (req.files?.imagen?.[0]) {
      try {
        const imgData = await uploadFileToS3(req.files.imagen[0], "mantencion");
        if (imgData?.Location) img_url = imgData.Location;
      } catch (error) {
        return res.status(500).json({ message: "Error al subir la imagen", error: error.message });
      }
    }

    // Insertar mantención
    const [result] = await pool.query(
      `INSERT INTO mantencion (
          bitacora_id, maquina_id, taller_id, estado_mantencion_id, tipo_mantencion_id, 
          fec_inicio, fec_termino, ord_trabajo, n_factura, cost_ser, isDeleted
        ) VALUES (?, ?, ?, ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, ?, 0)`,
      [
        bitacoraIdNumber, maquinaIdNumber, tallerIdNumber, estado_mantencion_id, tipoMantencionIdNumber,
        fec_inicio, fec_termino, ord_trabajo, n_factura || null, costSerNumber || null
      ]
    );

    // Enviar notificación
    const usuarios = await getNotificationUsers({
      compania_id, roles: ["TELECOM", "Teniente de Máquina", "Capitán"]
    });

    if (usuarios.length > 0) {
      const contenido = `Nueva mantención registrada - ${codigo} - Orden de trabajo: ${ord_trabajo}`;
      await createAndSendNotifications({
        contenido, tipo: "mantencion", usuarios,
        emailConfig: {
          subject: "Nueva Mantención Registrada",
          redirectUrl: `${process.env.FRONTEND_URL}/mantenciones/${result.insertId}`,
          buttonText: "Ver Detalles",
        },
      });
    }

    return res.json({
      id: result.insertId,
      bitacora_id: bitacoraIdNumber,
      maquina_id: maquinaIdNumber,
      taller_id: tallerIdNumber,
      estado_mantencion_id,
      tipo_mantencion_id: tipoMantencionIdNumber,
      fec_inicio, fec_termino, ord_trabajo, n_factura,
      cost_ser: costSerNumber, img_url, aprobada,
      message: "Mantención creada exitosamente",
    });

  } catch (error) {
    console.error("Error general en createMantencion:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Eliminar mantencion (cambiar estado)
export const deleteMantencion = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE mantencion SET isDeleted = 1 WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Mantención no encontrada",
      });
    }
    res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateMantencion = async (req, res) => {
  const { id } = req.params;
  const {
    bitacora_id,
    maquina_id,
    ord_trabajo,
    n_factura,
    cost_ser,
    taller_id,
    estado_mantencion_id,
    tipo_mantencion_id,
    isDeleted,
    fec_inicio, // Nueva columna
    fec_termino,
  } = req.body;

  const errors = []; // Array para capturar los errores

  try {
    // Verificar si la mantención existe (inicio)
    const [existing] = await pool.query(
      "SELECT 1 FROM mantencion WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Mantención no encontrada" });
    }

    // Validación de existencia de llaves foráneas
    const foreignKeyValidations = [
      { field: "bitacora_id", table: "bitacora" },
      { field: "maquina_id", table: "maquina" },
      { field: "taller_id", table: "taller" },
      { field: "estado_mantencion_id", table: "estado_mantencion" },
      { field: "tipo_mantencion_id", table: "tipo_mantencion" },
    ];

    const updates = {};

    // Validaciones para llaves foráneas
    for (const { field, table } of foreignKeyValidations) {
      if (req.body[field] !== undefined) {
        const [result] = await pool.query(
          `SELECT 1 FROM ${table} WHERE id = ? AND isDeleted = 0`,
          [req.body[field]]
        );
        if (result.length === 0) {
          errors.push(
            `${
              table.charAt(0).toUpperCase() + table.slice(1)
            } no existe o está eliminada`
          );
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    // Validaciones para los campos específicos
    if (ord_trabajo !== undefined) {
      if (typeof ord_trabajo !== "string") {
        errors.push("Tipo de dato inválido para 'ord_trabajo'");
      } else {
        updates.ord_trabajo = ord_trabajo;
      }
    }

    if (n_factura !== undefined) {
      if (typeof n_factura !== "number") {
        errors.push("Tipo de dato inválido para 'n_factura'");
      } else {
        updates.n_factura = n_factura;
      }
    }

    if (cost_ser !== undefined) {
      if (typeof cost_ser !== "number") {
        errors.push("Tipo de dato inválido para 'cost_ser'");
      } else {
        updates.cost_ser = cost_ser;
      }
    }

    // Validar y agregar fec_inicio
    if (fec_inicio !== undefined) {
      const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!fechaRegex.test(fec_inicio)) {
        errors.push(
          "El formato de la fecha de 'fec_inicio' es inválido. Debe ser dd-mm-aaaa"
        );
      } else {
        updates.fec_inicio = fec_inicio;
      }
    }

    // Validar y agregar fec_termino
    if (fec_termino !== undefined) {
      const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!fechaRegex.test(fec_termino)) {
        errors.push(
          "El formato de la fecha de 'fec_termino' es inválido. Debe ser dd-mm-aaaa"
        );
      } else {
        updates.fec_termino = fec_termino;
      }
    }

    // Validar y agregar isDeleted
    if (isDeleted !== undefined) {
      if (
        typeof isDeleted !== "number" ||
        (isDeleted !== 0 && isDeleted !== 1)
      ) {
        errors.push("Tipo de dato inválido para 'isDeleted'");
      } else {
        updates.isDeleted = isDeleted;
      }
    }

    // manejar la carga de archivos si existen
    let img_url = null;

    // manejo de subida de imagen S3
    if (req.files) {
      const imagen = req.files.imagen ? req.files.imagen[0] : null;

      if (imagen) {
        try {
          const imgData = await uploadFileToS3(imagen, "mantencion");
          if (imgData && imgData.Location) {
            img_url = imgData.Location;
            updates.img_url = img_url;
          } else {
            errors.push("No se pudo obtener la URL de la imagen");
          }
        } catch (error) {
          errors.push("Error al subir la imagen", error.message);
        }
      }
    }

    if (errors.length > 0) {
      console.log(errors);
      return res.status(400).json({ errors });
    }

    // Construir la cláusula SET para la actualización
    const setClause = Object.keys(updates)
      .map((key) => {
        if (key === "fec_inicio" || key === "fec_termino") {
          return `${key} = STR_TO_DATE(?, '%d-%m-%Y')`;
        }
        return `${key} = ?`;
      })
      .join(", ");

    if (!setClause) {
      errors.push("No se proporcionaron campos para actualizar");
      console.log(errors);
      return res.status(400).json({ errors });
    }

    // Preparar los valores para la actualización
    const values = Object.keys(updates)
      .map((key) => {
        if (key === "fec_inicio" || key === "fec_termino") {
          return req.body[key];
        }
        return updates[key];
      })
      .concat(id);

    // Realizar la actualización
    const [result] = await pool.query(
      `UPDATE mantencion SET ${setClause} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      // errors.push();
      return res.status(404).json({ message: "Mantención no encontrada" });
    }

    // Obtener y devolver el registro actualizado
    const [rows] = await pool.query("SELECT * FROM mantencion WHERE id = ?", [
      id,
    ]);
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al actualizar mantención: ", error);
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Nueva función para actualizar el estado de una mantención
export const updateMaintenanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_mantencion_id } = req.body;

    // Verificar que el estado existe
    const [estados] = await pool.query(
      "SELECT id FROM estado_mantencion WHERE id = ? AND isDeleted = 0",
      [estado_mantencion_id]
    );

    if (estados.length === 0) {
      return res
        .status(400)
        .json({ message: "El estado de mantención no existe" });
    }

    // Actualizar el estado
    await pool.query(
      "UPDATE mantencion SET estado_mantencion_id = ? WHERE id = ? AND isDeleted = 0",
      [estado_mantencion_id, id]
    );

    res.json({ message: "Estado de mantención actualizado correctamente" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const downloadExcel = async (req, res) => {
  try {
    const {
      taller,
      estado_mantencion,
      ord_trabajo,
      compania,
      fields, // campos para excel
    } = req.query;

    // Definir todos los posibles campos que puedes incluir
    const columnas = {
      id: "m.id",
      "bitacora.id": "bitacora.id",
      "bitacora.compania": "bitacora.compania",
      "bitacora.conductor": "bitacora.conductor",
      "bitacora.direccion": "bitacora.direccion",
      "bitacora.fh_salida": "bitacora.fh_salida",
      "bitacora.fh_llegada": "bitacora.fh_llegada",
      "bitacora.km_salida": "bitacora.km_salida",
      "bitacora.km_llegada": "bitacora.km_llegada",
      "bitacora.hmetro_salida": "bitacora.hmetro_salida",
      "bitacora.hmetro_llegada": "bitacora.hmetro_llegada",
      "bitacora.hbomba_salida": "bitacora.hbomba_salida",
      "bitacora.hbomba_llegada": "bitacora.hbomba_llegada",
      "bitacora.obs": "bitacora.obs",
      patente: "patente",
      fec_inicio: "fec_inicio",
      fec_termino: "fec_termino",
      ord_trabajo: "ord_trabajo",
      n_factura: "n_factura",
      img_url: "img_url",
      cost_ser: "cost_ser",
      taller: "taller",
      estado_mantencion: "estado_mantencion",
      tipo_mantencion: "tipo_mantencion",
      tipo_mantencion_id: "tipo_mantencion_id",
    };

    // Inicializar la consulta SQL base
    let query = `
            SELECT
                m.id,
                b.id AS 'bitacora.id',
                c.nombre AS 'bitacora.compania',
                CONCAT(p.rut) AS 'bitacora.conductor',
                b.direccion AS 'bitacora.direccion',
                DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS 'bitacora.fh_salida',
                DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS 'bitacora.fh_llegada',
                b.km_salida AS 'bitacora.km_salida',
                b.km_llegada AS 'bitacora.km_llegada',
                b.hmetro_salida AS 'bitacora.hmetro_salida',
                b.hmetro_llegada AS 'bitacora.hmetro_llegada',
                b.hbomba_salida AS 'bitacora.hbomba_salida',
                b.hbomba_llegada AS 'bitacora.hbomba_llegada',
                b.obs AS 'bitacora.obs',
                ma.patente AS 'patente',
                DATE_FORMAT(m.fec_inicio, '%d-%m-%Y') AS 'fec_inicio',
                DATE_FORMAT(m.fec_termino, '%d-%m-%Y') AS 'fec_termino',
                m.ord_trabajo,
                m.n_factura,
                m.img_url,
                m.cost_ser,
                t.razon_social AS 'taller',
                em.nombre AS 'estado_mantencion',
                tm.nombre AS 'tipo_mantencion',
                tm.id AS 'tipo_mantencion_id'
            FROM mantencion m
            INNER JOIN bitacora b ON m.bitacora_id = b.id
            INNER JOIN compania c ON b.compania_id = c.id
            INNER JOIN maquina ma ON m.maquina_id = ma.id
            INNER JOIN personal p ON b.personal_id = p.id
            INNER JOIN taller t ON m.taller_id = t.id
            INNER JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            INNER JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
            WHERE m.isDeleted = 0 AND b.isDeleted = 0
        `;

    const params = [];

    // Agregar filtros de búsqueda
    if (taller) {
      query += " AND t.razon_social = ?";
      params.push(taller);
    }
    if (estado_mantencion) {
      query += " AND em.nombre = ?";
      params.push(estado_mantencion);
    }
    if (ord_trabajo) {
      query += " AND m.ord_trabajo = ?";
      params.push(ord_trabajo);
    }
    if (compania) {
      query += " AND c.nombre = ?";
      params.push(compania);
    }

    // Ejecutar la consulta con los parámetros
    const [rows] = await pool.query(query, params);

    // Verificar si se proporcionaron campos específicos y filtrar las columnas
    const selectedColumns = fields ? fields.split(",") : Object.keys(columnas);

    // Filtrar las filas según las columnas seleccionadas
    const result = rows.map((row) => {
      let filteredRow = {};
      selectedColumns.forEach((col) => {
        if (row[col] !== undefined) {
          filteredRow[col] = row[col];
        }
      });
      return filteredRow;
    });

    // Usamos la función exportToExcel para enviar el archivo Excel
    exportToExcel(result, res, "mantenciones_detalle");
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Nueva función para aprobar/rechazar mantención
export const toggleAprobacionMantencion = async (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.body;

  try {
    // Verificar si la mantención existe
    const [mantencion] = await pool.query(
      "SELECT aprobada FROM mantencion WHERE id = ? AND isDeleted = 0",
      [id]
    );

    if (mantencion.length === 0) {
      return res.status(404).json({ message: "Mantención no encontrada" });
    }

    // Determinar el nuevo estado (toggle)
    const nuevoEstado = mantencion[0].aprobada === 1 ? 0 : 1;

    // Actualizar el estado
    const [result] = await pool.query(
      `UPDATE mantencion 
       SET aprobada = ?,
           aprobada_por = ?,
           fecha_aprobacion = ${nuevoEstado === 1 ? "NOW()" : "NULL"}
       WHERE id = ?`,
      [nuevoEstado, nuevoEstado === 1 ? usuario_id : null, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No se pudo actualizar la mantención" });
    }

    res.json({
      message:
        nuevoEstado === 1
          ? "Mantención aprobada exitosamente"
          : "Mantención rechazada exitosamente",
      aprobada: nuevoEstado,
    });
  } catch (error) {
    console.error("Error al aprobar/rechazar mantención:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};
