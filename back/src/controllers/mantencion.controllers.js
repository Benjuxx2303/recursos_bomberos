import { pool } from "../db.js";
import { exportToExcel } from "../utils/excelExport.js";
import { uploadFileToS3 } from "../utils/fileUpload.js";
import { generatePDF } from "../utils/generatePDF.js";
import { createAndSendNotifications, getNotificationTalleres, getNotificationUsers } from '../utils/notifications.js';
import { checkIfDeletedById } from "../utils/queries.js";
import { formatDateTime, validateDate } from "../utils/validations.js";

// con parámetros de búsqueda
// Paginacion
export const getMantencionesAllDetailsSearch = async (req, res) => {
  try {
    const { taller, estado_mantencion, ord_trabajo, compania, maquina_id, patente, page, pageSize } = req.query;

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
        CASE 
          WHEN em.nombre = 'Programada' THEN NULL 
          ELSE DATE_FORMAT(m.fec_termino, '%d-%m-%Y') 
        END AS 'fec_termino',
        m.descripcion,
        m.ord_trabajo,
        m.n_factura,
        m.img_url,
        m.cost_ser,
        t.razon_social AS 'taller',
        em.nombre AS 'estado_mantencion',
        tm.nombre AS 'tipo_mantencion',
        tm.id AS 'tipo_mantencion_id',
        m.aprobada AS 'aprobada',
        DATE_FORMAT(m.fecha_aprobacion, '%d-%m-%Y %H:%i') AS 'fecha_aprobacion'
      FROM mantencion m
      LEFT JOIN bitacora b ON m.bitacora_id = b.id
      LEFT JOIN compania c ON b.compania_id = c.id
      LEFT JOIN maquina ma ON m.maquina_id = ma.id
      LEFT JOIN personal p ON b.personal_id = p.id
      LEFT JOIN taller t ON m.taller_id = t.id
      LEFT JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
      LEFT JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
      WHERE m.isDeleted = 0
    `;

    // Array para almacenar los parámetros
    const params = [];

    // Aplicar filtros dinámicos
    if (taller) {
      query += " AND t.razon_social LIKE ?";
      params.push(`%${taller}%`);
    }
    if (estado_mantencion) {
      query += " AND em.nombre = ?";
      params.push(estado_mantencion);
    }
    if (ord_trabajo) {
      query += " AND m.ord_trabajo LIKE ?";
      params.push(`%${ord_trabajo}%`);
    }
    if (compania) {
      query += " AND c.nombre LIKE ?";
      params.push(`%${compania}%`);
    }
    if (maquina_id) {
      query += " AND ma.id = ?";
      params.push(maquina_id);
    }
    if (patente) {
      query += " AND ma.patente LIKE ?";
      params.push(`%${patente}%`);
    }

    // Ordenar por ID de mantención de forma descendente
      query += " ORDER BY m.id DESC";

    // Paginación
    if (page && pageSize) {
      const currentPage = parseInt(page) || 1;
      const currentPageSize = parseInt(pageSize) || 10;
      const offset = (currentPage - 1) * currentPageSize;

      query += " LIMIT ? OFFSET ?";
      params.push(currentPageSize, offset);
    }

    // Ejecutar la consulta
    const [rows] = await pool.query(query, params);

    // Formatear los resultados
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
      descripcion: row.descripcion,
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
      aprobada: row.aprobada,
      fecha_aprobacion: row.fecha_aprobacion,
    }));

    // Responder con los resultados y cantidad de filas
    res.json({ rows: result.length, data: result });
  } catch (error) {
    console.error("Error en getMantencionesAllDetailsSearch:", error);
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
                c.nombre AS 'bitacora.compania',
                CONCAT(p.rut) AS 'bitacora.conductor',
                b.direccion AS 'bitacora.direccion',
                b.maquina_id AS 'bitacora.maquina_id',
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
                ma.codigo AS 'maquina.codigo',
                ma.nombre AS 'maquina.nombre',
                DATE_FORMAT(m.fec_inicio, '%d-%m-%Y') AS 'fec_inicio',
                DATE_FORMAT(m.fec_termino, '%d-%m-%Y') AS 'fec_termino',
                m.ord_trabajo,
                m.maquina_id,
                m.n_factura,
                m.img_url as img_factura,
                m.cost_ser,
                m.aprobada,
                DATE_FORMAT(m.fecha_aprobacion, '%d-%m-%Y %H:%i') AS 'fecha_aprobacion',
                m.createdAt as fecha_ingreso,
                m.aprobada_por,
                m.personal_responsable_id,
                CONCAT(p_apr.nombre, ' ', p_apr.apellido) AS 'aprobador_nombre',
                CONCAT(p_resp.nombre, ' ', p_resp.apellido) AS 'responsable_nombre',
                concat(p_ing.nombre, ' ', p_ing.apellido) AS 'ingresada_por_nombre',
                t.razon_social AS 'taller',
                t.id AS 'taller_id',
                em.nombre AS 'estado_mantencion',
                tm.nombre AS 'tipo_mantencion',
                tm.id AS 'tipo_mantencion_id',
                CASE 
                  WHEN em.nombre = 'Programada' THEN 
                    CASE
                      WHEN TIMESTAMPDIFF(MONTH, NOW(), m.fec_inicio) > 0 THEN CONCAT(TIMESTAMPDIFF(MONTH, NOW(), m.fec_inicio), ' meses')
                      WHEN TIMESTAMPDIFF(WEEK, NOW(), m.fec_inicio) > 0 THEN CONCAT(TIMESTAMPDIFF(WEEK, NOW(), m.fec_inicio), ' semanas')
                      WHEN TIMESTAMPDIFF(DAY, NOW(), m.fec_inicio) > 0 THEN CONCAT(TIMESTAMPDIFF(DAY, NOW(), m.fec_inicio), ' días')
                      ELSE CONCAT(TIMESTAMPDIFF(HOUR, NOW(), m.fec_inicio), ' horas')
                    END
                  ELSE NULL
                END as tiempo_restante,
                m.descripcion
            FROM mantencion m
            LEFT JOIN bitacora b ON m.bitacora_id = b.id
            LEFT JOIN compania c ON b.compania_id = c.id
            LEFT JOIN maquina ma ON m.maquina_id = ma.id
            LEFT JOIN personal p ON b.personal_id = p.id
            LEFT JOIN personal p_apr ON m.aprobada_por = p_apr.id
            LEFT JOIN personal p_resp ON m.personal_responsable_id = p_resp.id
            LEFT JOIN personal p_ing ON m.ingresada_por = p_ing.id
            LEFT JOIN taller t ON m.taller_id = t.id
            LEFT JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            LEFT JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
            WHERE m.isDeleted = 0 AND  m.id = ?
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
      "bitacora.maquina_id": row["bitacora.maquina_id"],
      "bitacora.fh_salida": row["bitacora.fh_salida"],
      "bitacora.fh_llegada": row["bitacora.fh_llegada"],
      "bitacora.km_salida": row["bitacora.km_salida"],
      "bitacora.km_llegada": row["bitacora.km_llegada"],
      "bitacora.hmetro_salida": row["bitacora.hmetro_salida"],
      "bitacora.hmetro_llegada": row["bitacora.hmetro_llegada"],
      "bitacora.hbomba_salida": row["bitacora.hbomba_salida"],
      "bitacora.hbomba_llegada": row["bitacora.hbomba_llegada"],
      "bitacora.obs": row["bitacora.obs"],
      "maquina.codigo": row["maquina.codigo"],
      patente: row.patente,
      maquina_id: row.maquina_id,
      fec_inicio: row.fec_inicio,
      fec_termino: row.fec_termino,
      ord_trabajo: row.ord_trabajo,
      n_factura: row.n_factura,
      img_factura: row.img_factura,
      cost_ser: row.cost_ser,
      aprobada: row.aprobada,
      fecha_aprobacion: row.fecha_aprobacion,
     
      aprobada_por: row.aprobada_por,
      personal_responsable_id: row.personal_responsable_id,
      aprobador_nombre: row.aprobador_nombre,
      responsable_nombre: row.responsable_nombre,
      fecha_ingreso: row.fecha_ingreso,
      ingresada_por_nombre: row.ingresada_por_nombre,
      taller: row.taller,
      taller_id: row.taller_id,
      img_url: row.img_url,
      estado_mantencion: row.estado_mantencion,
      tipo_mantencion: row.tipo_mantencion,
      tipo_mantencion_id: row.tipo_mantencion_id,
      tiempo_restante: row.tiempo_restante,
      descripcion: row.descripcion,
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
    console.log("Datos recibidos en el servidor:", req.body);
    console.log("Archivos recibidos:", req.files);

    let {
      bitacora_id,
      maquina_id,
      taller_id,
      tipo_mantencion_id,
      fec_inicio,
      fec_termino,
      ord_trabajo,
      n_factura,
      cost_ser,
      descripcion,
      personal_id,
    } = req.body;

    // Convertir strings a números donde sea necesario
    maquina_id = maquina_id ? parseInt(maquina_id) : null;
    personal_id = personal_id ? parseInt(personal_id) : null;
    bitacora_id = bitacora_id ? parseInt(bitacora_id) : null;
    taller_id = taller_id ? parseInt(taller_id) : null;
    tipo_mantencion_id = tipo_mantencion_id ? parseInt(tipo_mantencion_id) : null;
    n_factura = n_factura ? parseInt(n_factura) : null;
    cost_ser = cost_ser ? parseFloat(cost_ser) : null;

    console.log("Datos después de la conversión:", {
      maquina_id,
      personal_id,
      bitacora_id,
      taller_id,
      tipo_mantencion_id,
      n_factura,
      cost_ser,
      descripcion
    });

    let errors = [];
    const estado_mantencion_id = 1;

    // Validaciones obligatorias
    if (!maquina_id || isNaN(maquina_id)) errors.push("El ID de máquina es obligatorio y debe ser un número válido");
    if (!descripcion) errors.push("La descripción es obligatoria");
    if (!personal_id || isNaN(personal_id)) errors.push("El ID del personal que ingresa es obligatorio y debe ser un número válido");

    // Validar que el personal_id existe
    if (personal_id) {
      const [personalExists] = await pool.query(
        "SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0",
        [personal_id]
      );
      if (!personalExists.length) {
        errors.push("El personal ingresado no existe o está eliminado");
      }
    }

    // Validar maquina_id si no viene de una bitácora
    if (maquina_id && !bitacora_id) {
      const [maquinaExists] = await pool.query(
        "SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0",
        [maquina_id]
      );
      if (!maquinaExists.length) {
        errors.push("La máquina no existe o está eliminada");
      }
    }

    // Validaciones opcionales solo si se proporcionan los campos
    if (bitacora_id) {
      await checkIfDeletedById(pool, bitacora_id, 'bitacora', errors);
      // Si hay bitácora, validar que el maquina_id coincida
      const [bitacoraMaquina] = await pool.query(
        "SELECT maquina_id FROM bitacora WHERE id = ? AND isDeleted = 0",
        [bitacora_id]
      );
      if (bitacoraMaquina.length && bitacoraMaquina[0].maquina_id !== maquina_id) {
        errors.push("El ID de la máquina no coincide con la bitácora proporcionada");
      }
    }

    if (taller_id) await checkIfDeletedById(pool, taller_id, 'taller', errors);
    if (tipo_mantencion_id) await checkIfDeletedById(pool, tipo_mantencion_id, 'tipo_mantencion', errors);

    // Validaciones de formato para campos opcionales
    if (fec_inicio && validateDate(fec_inicio) === false) {
      errors.push("El formato de la fecha de inicio es inválido. Debe ser dd-mm-yyyy");
    }
    
    if (fec_termino && validateDate(fec_termino) === false) {
      errors.push("El formato de la fecha de término es inválido. Debe ser dd-mm-yyyy");
    }

    // Validar estados según las fechas proporcionadas
    let estado_id = estado_mantencion_id;

    // Obtener fecha actual
    const fechaActual = new Date();

    // Caso 1: Si hay fecha de término -> verificar si es anterior a la fecha actual
    if (fec_termino && validateDate(fec_termino)) {
      const fechaTermino = new Date(formatDateTime(fec_termino));
      
      if (fechaTermino < fechaActual) {
        // Si es anterior -> Completada
        const [estadoCompletada] = await pool.query(
          "SELECT id FROM estado_mantencion WHERE nombre = 'Completada' AND isDeleted = 0"
        );
        if (estadoCompletada.length > 0) {
          estado_id = estadoCompletada[0].id;
        }
      } else if (!fec_inicio) {
        // Si es posterior y no hay fecha de inicio -> Programada
        const [estadoProgramada] = await pool.query(
          "SELECT id FROM estado_mantencion WHERE nombre = 'Programada' AND isDeleted = 0"
        );
        if (estadoProgramada.length > 0) {
          estado_id = estadoProgramada[0].id;
        }
      }
    }
    // Caso 2: Si hay fecha de inicio pero no hay fecha de término -> En Proceso
    else if (fec_inicio && validateDate(fec_inicio) && !fec_termino) {
      const [estadoEnProceso] = await pool.query(
        "SELECT id FROM estado_mantencion WHERE nombre = 'En Proceso' AND isDeleted = 0"
      );
      if (estadoEnProceso.length > 0) {
        estado_id = estadoEnProceso[0].id;
      }
    }

    if (n_factura && isNaN(n_factura)) errors.push("El número de factura debe ser un número válido");
    if (cost_ser && isNaN(cost_ser)) errors.push("El costo del servicio debe ser un número válido");

    if (errors.length > 0) return res.status(400).json({ message: "Errores en los datos de entrada", errors });

    // Preparar los campos para la inserción
    const fieldsToInsert = ['maquina_id', 'estado_mantencion_id', 'descripcion', 'ingresada_por', 'isDeleted'];
    const valuesToInsert = [maquina_id, estado_id, descripcion, personal_id, 0];
    
    // Agregar campos opcionales solo si están presentes
    if (bitacora_id) {
      fieldsToInsert.push('bitacora_id');
      valuesToInsert.push(bitacora_id);
    }
    if (taller_id) {
      fieldsToInsert.push('taller_id');
      valuesToInsert.push(taller_id);
    }
    if (tipo_mantencion_id) {
      fieldsToInsert.push('tipo_mantencion_id');
      valuesToInsert.push(tipo_mantencion_id);
    }
    if (fec_inicio) {
      fieldsToInsert.push('fec_inicio');
      valuesToInsert.push(formatDateTime(fec_inicio));
    }
    if (fec_termino) {
      fieldsToInsert.push('fec_termino');
      valuesToInsert.push(formatDateTime(fec_termino));
    }
    if (ord_trabajo) {
      fieldsToInsert.push('ord_trabajo');
      valuesToInsert.push(ord_trabajo);
    }
    if (n_factura) {
      fieldsToInsert.push('n_factura');
      valuesToInsert.push(n_factura);
    }
    if (cost_ser) {
      fieldsToInsert.push('cost_ser');
      valuesToInsert.push(cost_ser);
    }

    // Manejar la imagen si existe
    if (req.files?.imagen?.[0]) {
      try {
        const imgData = await uploadFileToS3(req.files.imagen[0], "mantencion");
        if (imgData?.Location) {
          fieldsToInsert.push('img_url');
          valuesToInsert.push(imgData.Location);
        }
      } catch (error) {
        return res.status(500).json({ message: "Error al subir la imagen", error: error.message });
      }
    }

    // Construir la consulta dinámica
    const query = `INSERT INTO mantencion (${fieldsToInsert.join(', ')}) VALUES (${fieldsToInsert.map(() => '?').join(', ')})`;

    // Insertar mantención
    const [result] = await pool.query(query, valuesToInsert);

    // // Obtener datos para el PDF y notificaciones
    // const [datosPDF] = await pool.query(
    //   `SELECT 
    //     m.ord_trabajo AS 'orden_trabajoPDF',
    //     m.id AS 'mantencion_idPDF',
    //     m.bitacora_id AS 'bitacora_idPDF',
    //     ma.nombre AS 'maquinaPDF',
    //     ma.patente AS 'patentePDF',
    //     t.nombre AS 'tallerPDF',
    //     em.nombre AS 'estado_mantencionPDF',
    //     tm.nombre AS 'tipo_mantencionPDF',
    //     DATE_FORMAT(m.fec_inicio, '%d-%m-%Y') AS 'fecha_inicioPDF',
    //     DATE_FORMAT(m.fec_termino, '%d-%m-%Y') AS 'fecha_terminoPDF',
    //     m.n_factura AS 'numero_facturaPDF',
    //     m.cost_ser AS 'costo_servicioPDF',
    //     m.descripcion AS 'descripcionPDF',
    //     p.nombre AS 'ingresada_por_nombre',
    //     p.apellido AS 'ingresada_por_apellido'
    //   FROM mantencion m
    //   INNER JOIN maquina ma ON m.maquina_id = ma.id
    //   LEFT JOIN taller t ON m.taller_id = t.id
    //   LEFT JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
    //   INNER JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
    //   INNER JOIN personal p ON m.ingresada_por = p.id
    //   WHERE m.id = ?`,
    //   [result.insertId]
    // );

    // const { orden_trabajoPDF, mantencion_idPDF, bitacora_idPDF, maquinaPDF, patentePDF, tallerPDF, estado_mantencionPDF, tipo_mantencionPDF, fecha_inicioPDF, fecha_terminoPDF, numero_facturaPDF, costo_servicioPDF, descripcionPDF, ingresada_por_nombre, ingresada_por_apellido } = datosPDF[0];

    // // Preparar los datos del PDF
    //  const pdfData = [{
    //   "Orden de Trabajo": orden_trabajoPDF,
    //   "ID de Mantención": mantencion_idPDF,
    //   "ID de Bitácora": bitacora_idPDF,
    //   "Máquina": maquinaPDF,
    //   "Patente": patentePDF,
    //   "Taller": tallerPDF,
    //   "Estado de Mantención": estado_mantencionPDF,
    //   "Tipo de Mantención": tipo_mantencionPDF,
    //   "Fecha de Inicio": fecha_inicioPDF,
    //   "Fecha de Término": fecha_terminoPDF,
    //   "Número de Factura": numero_facturaPDF,
    //   "Costo del Servicio": costo_servicioPDF,
    //   "Descripción": descripcionPDF,
    //   "Ingresada por": `${ingresada_por_nombre} ${ingresada_por_apellido}`
    // }];
 
    // // Generar el PDF
    // const pdfBuffer = await generatePDF(pdfData); 

    const [maquina] = await pool.query("SELECT codigo, patente, compania_id FROM maquina WHERE id = ?", [maquina_id]);
    const [personal] = await pool.query("SELECT nombre, apellido, compania_id FROM personal WHERE id = ?", [personal_id]);

    // Enviar notificación (con filtros)
    const [usuariosCargosImportantes, usuariosTenientes, usuariosCapitanesPersonal, usuariosCapitanesMaquina, usuarioPersonal] = await Promise.all([
      getNotificationUsers({ cargos_importantes: true }), // Todos los usuarios con cargos importantes
      getNotificationUsers({ rol: 'Teniente de Máquina', compania_id: maquina[0].compania_id }), // Tenientes de la compañía de la máquina
      getNotificationUsers({ rol: 'Capitán', compania_id: personal[0].compania_id }),
      getNotificationUsers({ rol: 'Capitán', compania_id: maquina[0].compania_id }),
      getNotificationUsers({ personal_id: personal_id })
    ]);

    // Juntar todos los usuarios en un solo array
    const todosLosUsuarios = [...usuariosCargosImportantes, ...usuariosTenientes, ...usuariosCapitanesPersonal, ...usuariosCapitanesMaquina, ...usuarioPersonal];

    // console.log(usuarioPersonal);
    // console.log(usuariosCargosImportantes);
    // console.log(usuariosTenientes);
    // console.log(usuariosCapitanesPersonal);
    // console.log(usuariosCapitanesMaquina);

    if (todosLosUsuarios.length > 0) {
      let contenido = `Nueva mantención ingresada - Codigo: ${maquina[0].codigo} - Patente: ${maquina[0].patente} - Ingresada por ${personal[0].nombre} ${personal[0].apellido} - Descripcion: ${descripcion}\n`;

      // **Si se incluyó "cost_ser", se agrega a la notificación**
      if (cost_ser){
        contenido += `Costo del servicio: $${cost_ser}\n`;
      } 

      await createAndSendNotifications({
        contenido, 
        tipo: "mantencion", 
        destinatarios: todosLosUsuarios,
        emailConfig: {
          subject: "Nueva Mantención Ingresada",
          redirectUrl: `${process.env.FRONTEND_URL}/mantenciones/${result.insertId}`,
          buttonText: "Ver Detalles",
          // attachments: [{
          //   filename: `mantencion_${result.insertId}.pdf`,
          //   content: pdfBuffer,
          //   contentType: 'application/pdf'
          // }] 
        },
      });
    }

    return res.json({
      id: result.insertId,
      message: "Mantención creada exitosamente"
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
    return res.json({ message: "Mantención eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar mantención:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
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
    descripcion,
    personal_responsable_id,
    aprobada
    
  } = req.body;

  const errors = []; // Array para capturar los errores

  try {
    // Verificar si la mantención existe (inicio)
    const [existing] = await pool.query(
      "SELECT fec_inicio, fec_termino FROM mantencion WHERE id = ?",
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
      { field: "personal_responsable_id", table: "personal" },
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
    if (aprobada !== undefined) {
      if (typeof aprobada !== "number") {
        errors.push("Tipo de dato inválido para 'aprobada'");
      } else {
        updates.aprobada = aprobada;
      }
    }
    if (cost_ser !== undefined) {
      if (typeof cost_ser !== "number") {
        errors.push("Tipo de dato inválido para 'cost_ser'");
      } else {
        updates.cost_ser = cost_ser;
      }
    }

    // Validar y agregar descripcion
    if (descripcion !== undefined) {
      if (typeof descripcion !== "string") {
        errors.push("Tipo de dato inválido para 'descripcion'");
      } else {
        updates.descripcion = descripcion;
      }
    }

    // Validar fechas y actualizar estado según corresponda
    let nuevaFecInicio = fec_inicio ? formatDateTime(fec_inicio) : existing[0].fec_inicio;
    let nuevaFecTermino = fec_termino ? formatDateTime(fec_termino) : existing[0].fec_termino;

    // Validar formato de fechas
    if (fec_inicio !== undefined) {
      if (!validateDate(fec_inicio)) {
        errors.push("El formato de la fecha de 'fec_inicio' es inválido. Debe ser dd-mm-aaaa");
      } else {
        updates.fec_inicio = nuevaFecInicio;
      }
    }

    if (fec_termino !== undefined) {
      if (!validateDate(fec_termino)) {
        errors.push("El formato de la fecha de 'fec_termino' es inválido. Debe ser dd-mm-aaaa");
      } else {
        updates.fec_termino = nuevaFecTermino;
      }
    }

    // Determinar estado según las fechas
    if (!errors.length) {
      const fechaActual = new Date();

      // Caso 1: Si se proporciona fecha de término
      if (fec_termino && validateDate(fec_termino)) {
        const fechaTermino = new Date(formatDateTime(fec_termino));
        
        if (fechaTermino < fechaActual) {
          // Si es anterior a la fecha actual -> Completada
          const [estadoCompletada] = await pool.query(
            "SELECT id FROM estado_mantencion WHERE nombre = 'Completada' AND isDeleted = 0"
          );
          if (estadoCompletada.length > 0) {
            updates.estado_mantencion_id = estadoCompletada[0].id;
          }
        } else {
          // Si es posterior a la fecha actual
          const fechaInicio = nuevaFecInicio ? new Date(nuevaFecInicio) : null;
          
          if (fechaInicio && fechaInicio < fechaActual) {
            // Si hay fecha de inicio y es anterior a la fecha actual -> En Proceso
            const [estadoEnProceso] = await pool.query(
              "SELECT id FROM estado_mantencion WHERE nombre = 'En Proceso' AND isDeleted = 0"
            );
            if (estadoEnProceso.length > 0) {
              updates.estado_mantencion_id = estadoEnProceso[0].id;
            }
          }
        }
      }
      // Caso 2: Si se proporciona/existe fecha de inicio pero no hay fecha de término -> En Proceso
      else if (nuevaFecInicio && !nuevaFecTermino) {
        const [estadoEnProceso] = await pool.query(
          "SELECT id FROM estado_mantencion WHERE nombre = 'En Proceso' AND isDeleted = 0"
        );
        if (estadoEnProceso.length > 0) {
          updates.estado_mantencion_id = estadoEnProceso[0].id;
        }
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
      return res.status(400).json({ errors });
    }

    // Construir la cláusula SET para la actualización
    const setClause = Object.keys(updates)
      .map((key) => {
        if (key === "fec_inicio" || key === "fec_termino") {
          return `${key} = ?`; // Ya convertí las fechas antes, no se necesita STR_TO_DATE
        }
        return `${key} = ?`;
      })
      .join(", ");

    if (!setClause) {
      errors.push("No se proporcionaron campos para actualizar");
      return res.status(400).json({ errors });
    }

    // Preparar los valores para la actualización
    const values = Object.keys(updates)
      .map((key) => {
        return updates[key]; // Las fechas ya están en el formato MySQL
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
// Nueva función para aprobar mantención
export const aprobarMantencion = async (req, res) => {
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

    // Obtener el último número de orden de trabajo
    const [ultimaOrden] = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(ord_trabajo, 4) AS UNSIGNED)) AS ultimo_numero FROM mantencion"
    );

    let nuevoNumero = 25026; // Número inicial si no hay registros
    if (ultimaOrden[0].ultimo_numero !== null) {
      nuevoNumero = ultimaOrden[0].ultimo_numero + 1;
    }

    // si el utlimaOrden[0].ultimo_numero es menor a 25026, se asigna 25026
    if (nuevoNumero < 25026) {
      nuevoNumero = 25026;
    }

    const nuevaOrdenTrabajo = `OT-${nuevoNumero}`;

    // Obtener el id de la máquina
    const [idMaquina] = await pool.query(
      `
      SELECT maquina_id
      FROM mantencion 
      WHERE id = ?
      AND isDeleted = 0
      `,
      [id]
    );
    const maquina_id = idMaquina[0].maquina_id;

    // Obtener el personal_id correspondiente al usuario_id (quien aprueba)
    const [personalInfo] = await pool.query(
      "SELECT personal_id FROM usuario WHERE id = ?",
      [usuario_id]
    );

    if (personalInfo.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const personal_id = personalInfo[0].personal_id;

    // Actualizar el estado a aprobado y asignar la nueva orden de trabajo
    const [result] = await pool.query(
      `
      UPDATE mantencion 
      SET aprobada = 1,
          aprobada_por = ?,
          fecha_aprobacion = NOW(),
          ord_trabajo = ?
      WHERE id = ?
      `,
      [personal_id, nuevaOrdenTrabajo, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No se pudo actualizar la mantención" });
    }

    // Inicio envío de notificaciones
    const [datosPDF] = await pool.query(
      `
      SELECT 
        m.ord_trabajo AS 'orden_trabajoPDF', 
        c.nombre AS 'companiaPDF',
        CONCAT(ma.nombre, ' - PAT: ', ma.patente) AS 'movilPDF',
        tm.nombre AS 'tipo_mantencionPDF',
        m.descripcion AS 'descripcionPDF',
        ma.kmetraje AS 'kmetrajePDF',
        CONCAT(p.nombre, ' ', p.apellido) AS 'aprobadoPorPDF',
        rp.nombre AS 'reportadoPorPDF',
        u.correo AS 'emailSolicitantePDF',
        t.nombre AS 'tallerPDF',
        t.correo AS 'proveedor',
        t.id AS 'taller_idPDF'
      FROM mantencion m
      LEFT JOIN maquina ma ON m.maquina_id = ma.id
      LEFT JOIN compania c ON ma.compania_id = c.id -- toma la compania de la maquina
      LEFT JOIN taller t ON m.taller_id = t.id
      LEFT JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
      LEFT JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
      LEFT JOIN personal p ON m.aprobada_por = p.id
      LEFT JOIN rol_personal rp ON p.rol_personal_id = rp.id
      LEFT JOIN usuario u ON p.id = u.personal_id
      WHERE m.id = ?
      `,
      [id]
    );

    const { orden_trabajoPDF, companiaPDF, movilPDF, tipo_mantencionPDF, descripcionPDF, kmetrajePDF, aprobadoPorPDF, reportadoPorPDF, emailSolicitantePDF, tallerPDF, proveedor, taller_idPDF } = datosPDF[0];

    // Preparar los datos del PDF
    const pdfData = [
      {
        "Orden de Trabajo": orden_trabajoPDF,
        "Compañía": companiaPDF,
        "Móvil": movilPDF,
        "Tipo de Mantención": tipo_mantencionPDF,
        "Descripción": descripcionPDF,
        "Kilometraje": kmetrajePDF,
        "Aprobado por": aprobadoPorPDF,
        "Reportado por": reportadoPorPDF,
        "Email Solicitante": emailSolicitantePDF,
        "Taller": tallerPDF,
        "Proveedor": proveedor,
      },
    ];

    // Generar el PDF
    const pdfBuffer = await generatePDF(pdfData);

    // Obtener taller al que notificar
    const taller = await getNotificationTalleres({ nombre: tallerPDF });
    const [datosTaller] = await pool.query(
      `
      SELECT
        t.nombre AS nombre_taller,
        t.contacto AS contacto_taller
      FROM taller t
      WHERE t.id = ?
      ;
      `,
      [taller_idPDF]
    );
    const { nombre_taller, contacto_taller } = datosTaller[0];

    // Obtener usuarios a notificar
    const [maquina] = await pool.query(
      "SELECT codigo, patente, compania_id FROM maquina WHERE id = ?",
      [maquina_id]
    );
    const [personal] = await pool.query(
      "SELECT nombre, apellido, compania_id FROM personal WHERE id = ?",
      [personal_id]
    );
    const [quienIngreso] = await pool.query(
      "SELECT ingresada_por FROM mantencion WHERE id = ?",
      [id]
    );

    // Enviar notificación (con filtros)
    const [
      usuariosCargosImportantes,
      usuariosTenientes,
      usuariosCapitanesPersonal,
      usuariosCapitanesMaquina,
      usuarioPersonal,
      usuarioQueIngreso,
    ] = await Promise.all([
      getNotificationUsers({ cargos_importantes: true }), // Todos los usuarios con cargos importantes
      getNotificationUsers({ rol: 'Teniente de Máquina', compania_id: maquina[0].compania_id }), // Tenientes de la compañía de la máquina
      getNotificationUsers({ rol: 'Capitán', compania_id: personal[0].compania_id }), // Capitanes de la compañía del personal
      getNotificationUsers({ rol: 'Capitán', compania_id: maquina[0].compania_id }), // Capitanes de la compañía de la máquina
      getNotificationUsers({ personal_id: personal_id }), // Usuario que aprobó
      getNotificationUsers({ personal_id: quienIngreso[0].ingresada_por }), // Usuario que ingresó la mantención
    ]);

    // Juntar todos los usuarios en un solo array
    const todosLosUsuarios = [
      ...usuariosCargosImportantes,
      ...usuariosTenientes,
      ...usuariosCapitanesPersonal,
      ...usuariosCapitanesMaquina,
      ...usuarioPersonal,
      ...usuarioQueIngreso,
    ];

    // enviar notificación (solo usuarios)
    if (todosLosUsuarios.length > 0) {
      let contenido = `Mantención aprobada - Orden de trabajo: ${orden_trabajoPDF}\n`;

      await createAndSendNotifications({
        contenido,
        tipo: "mantencion",
        destinatarios: todosLosUsuarios,
        emailConfig: {
          subject: "Mantención Aprobada",
          redirectUrl: `${process.env.FRONTEND_URL}/mantenciones/${id}`,
          buttonText: "Ver Detalles",
          attachments: [
            {
              filename: `mantencion_${id}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ],
        },
      });
    }

    // enviar notificacion (solo taller)
    if (taller.length > 0) {
      let contenido = `
      Estimados/as <b>${nombre_taller}</b>,<br><br>
      
      El Cuerpo de Bomberos de Osorno solicita la mantención de nuestro móvil: "<b>${movilPDF}</b>", según lo indicado en el documento adjunto.<br><br>
      
      La mantención de tipo <b>${tipo_mantencionPDF}</b>. Agradeceríamos recibir una cotización y disponibilidad para el servicio a la brevedad.<br><br>
      
      Para consultas, contactar a <b>${contacto_taller}</b>, quien gestionará el proceso.<br><br>
      
      Adjunto PDF con detalles técnicos y especificaciones.<br><br>
      
      Saludos cordiales,<br>
      Cuerpo de Bomberos de Osorno<br>
      <b>${companiaPDF}</b>
      `;

      await createAndSendNotifications({
        contenido,
        tipo: "mantencion",
        destinatarios: taller,
        emailConfig: {
          subject: "Mantención Cuerpo Bomberos Osorno",
          redirectUrl: `mailto://${emailSolicitantePDF}`,
          buttonText: "Contactar Solicitante",
          attachments: [
            {
              filename: `mantencion_${id}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ],
        },
      });
    }

    // Fin envío de notificaciones

    res.json({
      message: "Mantención aprobada exitosamente",
      aprobada: 1,
    });
  } catch (error) {
    console.error("Error al aprobar mantención:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Nueva función para rechazar mantención
export const rechazarMantencion = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si la mantención existe
    const [mantencion] = await pool.query(
      "SELECT aprobada FROM mantencion WHERE id = ? AND isDeleted = 0",
      [id]
    );

    if (mantencion.length === 0) {
      return res.status(404).json({ message: "Mantención no encontrada" });
    }

    // Actualizar el estado a rechazado
    const [result] = await pool.query(
      `UPDATE mantencion 
       SET aprobada = 0
       WHERE id = ?`,
      [id]
    );
// se podria eventualmente ,poder modificar la fecha de aprobacion y usarla como fecha de rechazo asi como el aprobador/rechazador
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No se pudo actualizar la mantención" });
    }

    res.json({
      message: "Mantención rechazada exitosamente",
      aprobada: 0,
    });
  } catch (error) {
    console.error("Error al rechazar mantención:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Función para crear mantenciones periódicas
export const createMantencionPeriodica = async (req, res) => {
  try {
    const {
      maquina_id,
      taller_id,
      personal_responsable_id,
      fechas,
      dias_habiles,
      intervalo_dias,
      descripcion,
      cost_ser_estimado,
      ingresada_por
    } = req.body;

    // Validaciones básicas solo para campos obligatorios
    if (!maquina_id || !fechas || !fechas.length || !descripcion || !ingresada_por) {
      return res.status(400).json({
        message: "Faltan campos requeridos",
        required: ["maquina_id", "fechas", "descripcion", "ingresada_por"]
      });
    }

    // Validar que la máquina existe
    const [maquinaExists] = await pool.query(
      "SELECT id, compania_id FROM maquina WHERE id = ? AND isDeleted = 0",
      [maquina_id]
    );

    if (!maquinaExists.length) {
      return res.status(400).json({ message: "La máquina no existe o está eliminada" });
    }

    const compania_id = maquinaExists[0].compania_id;

    // Validar que el usuario que ingresa existe
    const [ingresadorExists] = await pool.query(
      "SELECT id FROM personal WHERE id = ? AND isDeleted = 0",
      [ingresada_por]
    );

    if (!ingresadorExists.length) {
      return res.status(400).json({ message: "El usuario que ingresa la mantención no existe o está eliminado" });
    }

    // Validar que el responsable existe y pertenece a la compañía (si se proporciona)
    if (personal_responsable_id) {
      const [responsableExists] = await pool.query(
        "SELECT id FROM personal WHERE id = ? AND compania_id = ? AND isDeleted = 0",
        [personal_responsable_id, compania_id]
      );

      if (!responsableExists.length) {
        return res.status(400).json({ message: "El responsable no existe o no pertenece a la compañía" });
      }
    }

    // Validar que el taller existe (si se proporciona)
    if (taller_id) {
      const [tallerExists] = await pool.query(
        "SELECT id FROM taller WHERE id = ? AND isDeleted = 0",
        [taller_id]
      );

      if (!tallerExists.length) {
        return res.status(400).json({ message: "El taller no existe o está eliminado" });
      }
    }

    // Obtener el ID del estado "Programada"
    const [estadoProgramada] = await pool.query(
      "SELECT id FROM estado_mantencion WHERE nombre = 'Programada' AND isDeleted = 0"
    );

    if (!estadoProgramada.length) {
      return res.status(400).json({ message: "No se encontró el estado 'Programada'" });
    }

    // Obtener el ID del tipo "Preventiva"
    const [tipoPreventiva] = await pool.query(
      "SELECT id FROM tipo_mantencion WHERE nombre = 'Preventiva' AND isDeleted = 0"
    );

    if (!tipoPreventiva.length) {
      return res.status(400).json({ message: "No se encontró el tipo 'Preventiva'" });
    }

    const estado_mantencion_id = estadoProgramada[0].id;
    const tipo_mantencion_id = tipoPreventiva[0].id;

    // Crear las mantenciones programadas
    const mantencionesProgramadas = [];
    let errorEnCreacion = false;

    for (const fecha of fechas) {
      try {
        // Transformar la fecha a formato MySQL
        const fechaTransformada = formatDateTime(fecha);

        // Validar si la fecha transformada es nula (fecha no válida)
        if (!fechaTransformada) {
          return res.status(400).json({ message: `La fecha ${fecha} no es válida` });
        }

        // Preparar los campos y valores para la inserción
        const fields = ['maquina_id', 'estado_mantencion_id', 'tipo_mantencion_id', 'fec_inicio', 'descripcion', 'isDeleted', 'ingresada_por'];
        const values = [maquina_id, estado_mantencion_id, tipo_mantencion_id, fechaTransformada, descripcion, 0, ingresada_por];

        // Agregar campos opcionales si están presentes
        if (taller_id) {
          fields.push('taller_id');
          values.push(taller_id);
        }
        if (personal_responsable_id) {
          fields.push('personal_responsable_id');
          values.push(personal_responsable_id);
        }
        if (cost_ser_estimado) {
          fields.push('cost_ser');
          values.push(cost_ser_estimado);
        }

        // Crear la mantención programada
        const [mantencionResult] = await pool.query(
          `INSERT INTO mantencion (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
          values
        );

        mantencionesProgramadas.push({
          id: mantencionResult.insertId,
          fecha: fechaTransformada
        });

      } catch (error) {
        console.error(`Error al crear mantención para fecha ${fecha}:`, error);
        errorEnCreacion = true;
        break;
      }
    }

    // Si hubo error, hacer rollback manual eliminando las mantenciones creadas
    if (errorEnCreacion) {
      for (const mantencion of mantencionesProgramadas) {
        try {
          await pool.query("UPDATE mantencion SET isDeleted = 1 WHERE id = ?", [mantencion.id]);
        } catch (error) {
          console.error("Error en rollback:", error);
        }
      }
      return res.status(500).json({
        message: "Error al crear algunas mantenciones periódicas",
        mantenciones_creadas: mantencionesProgramadas.length,
        total_solicitadas: fechas.length
      });
    }

    try {
      // Enviar notificación
      const usuarios = await getNotificationUsers({
        compania_id,
        roles: ["TELECOM", "Teniente de Máquina", "Capitán"]
      });

      if (usuarios && usuarios.length > 0) {
        const contenido = `Se han programado ${mantencionesProgramadas.length} mantenciones periódicas`;
        await createAndSendNotifications({
          contenido,
          tipo: "mantencion",
          destinatarios: usuarios,
          emailConfig: {
            subject: "Nuevas Mantenciones Periódicas Programadas",
            redirectUrl: `${process.env.FRONTEND_URL}/mantenciones`,
            buttonText: "Ver Mantenciones",
          },
        });
      }
    } catch (notificationError) {
      console.error("Error al enviar notificaciones:", notificationError);
      // No retornamos error aquí ya que las mantenciones se crearon correctamente
    }

    return res.status(201).json({
      message: "Mantenciones periódicas creadas exitosamente",
      mantenciones: mantencionesProgramadas
    });

  } catch (error) {
    console.error("Error en createMantencionPeriodica:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};
// Nueva función para cambiar el estado de una mantención a 'EnProceso'
export const enProceso = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener el ID del estado 'EnProceso'
    const [estadoEnProceso] = await pool.query(
      "SELECT id FROM estado_mantencion WHERE nombre = 'En Proceso' AND isDeleted = 0"
    );

    if (estadoEnProceso.length === 0) {
      return res.status(400).json({ message: "El estado 'EnProceso' no existe" });
    }

    // Actualizar el estado de la mantención y establecer la fecha de inicio
    await pool.query(
      "UPDATE mantencion SET estado_mantencion_id = ?, fec_inicio = NOW() WHERE id = ? AND isDeleted = 0",
      [estadoEnProceso[0].id, id]
    );

    res.json({ message: "Estado de mantención actualizado a 'EnProceso' y fecha de inicio establecida" });
  } catch (error) {
    console.error("Error al actualizar estado de mantención y fecha de inicio:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

export const completarMantencion = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener el ID del estado 'Completada'
    const [estadoCompletada] = await pool.query(
      "SELECT id FROM estado_mantencion WHERE nombre = 'Completada' AND isDeleted = 0"
    );

    if (estadoCompletada.length === 0) {
      return res.status(400).json({ message: "El estado 'Completada' no existe" });
    }

    // Actualizar el estado de la mantención y establecer la fecha de término
    await pool.query(
      "UPDATE mantencion SET estado_mantencion_id = ?, fec_termino = NOW() WHERE id = ? AND isDeleted = 0",
      [estadoCompletada[0].id, id]
    );

    res.json({ message: "Mantención completada exitosamente y fecha de término establecida" });
  } catch (error) {
    console.error("Error al completar mantención y establecer fecha de término:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};


// nueva ruta para enviar a evaluacion
export const enviarAEvaluacion = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener el ID del estado 'Completada'
    const [estadoEvaluacion] = await pool.query(
      "SELECT id FROM estado_mantencion WHERE nombre = 'Evaluacion' AND isDeleted = 0"
    );

    if (estadoEvaluacion.length === 0) {
      return res.status(400).json({ message: "El estado 'Evaluacion' no existe" });
    }
    // Actualizar el estado de la mantención
    await pool.query(
      "UPDATE mantencion SET estado_mantencion_id = ? WHERE id = ? AND isDeleted = 0",
      [estadoEvaluacion[0].id, id]
    );

    res.json({ message: "Mantención enviada a evaluacion exitosamente" });
  } catch (error) {
    console.error("Error al enviar a evaluacion:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};