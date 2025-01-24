import { pool } from "../db.js";
import {
    uploadFileToS3
} from '../utils/fileUpload.js';
import { validateDate, validateFloat, validateStartEndDate } from "../utils/validations.js";
import { exportToExcel } from "../utils/excelExport.js";


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

        const result = rows.map(row => ({
            id: row.id,
            bitacora: {
                id: row['bitacora.id'],
                compania: row['bitacora.compania'],
                conductor: row['bitacora.conductor'],
                direccion: row['bitacora.direccion'],
                h_salida: row['bitacora.h_salida'],
                h_llegada: row['bitacora.h_llegada'],
                km_salida: row['bitacora.km_salida'],
                km_llegada: row['bitacora.km_llegada'],
                hmetro_salida: row['bitacora.hmetro_salida'],
                hmetro_llegada: row['bitacora.hmetro_llegada'],
                hbomba_salida: row['bitacora.hbomba_salida'],
                hbomba_llegada: row['bitacora.hbomba_llegada'],
                obs: row['bitacora.obs'],
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
            tipo_mantencion_id: row.tipo_mantencion_id
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
        const { taller, estado_mantencion, ord_trabajo, compania, page, pageSize } = req.query;

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
            query += ' AND t.razon_social = ?';
            params.push(taller);
        }
        if (estado_mantencion) {
            query += ' AND em.nombre = ?';
            params.push(estado_mantencion);
        }
        if (ord_trabajo) {
            query += ' AND m.ord_trabajo = ?';
            params.push(ord_trabajo);
        }
        if (compania) {
            query += ' AND c.nombre = ?';
            params.push(compania);
        }

        // Si se proporciona "page", se aplica paginación
        if (page) {
            const currentPage = parseInt(page) || 1; // Página actual, por defecto 1
            const currentPageSize = parseInt(pageSize) || 10; // Página tamaño, por defecto 10
            const offset = (currentPage - 1) * currentPageSize; // Calcular el offset para la consulta

            // Añadir LIMIT y OFFSET a la consulta
            query += ' LIMIT ? OFFSET ?';
            params.push(currentPageSize, offset);
        }

        query += " ORDER BY m.id DESC"

        // Ejecutar la consulta con los parámetros
        const [rows] = await pool.query(query, params);

        // Mapeo de resultados a la estructura deseada
        const result = rows.map(row => ({
            id: row.id,
            'bitacora.id': row['bitacora.id'],
            'bitacora.compania': row['bitacora.compania'],
            'bitacora.conductor': row['bitacora.conductor'],
            'bitacora.direccion': row['bitacora.direccion'],
            'bitacora.fh_salida': row['bitacora.fh_salida'],
            'bitacora.fh_llegada': row['bitacora.fh_llegada'],
            'bitacora.km_salida': row['bitacora.km_salida'],
            'bitacora.km_llegada': row['bitacora.km_llegada'],
            'bitacora.hmetro_salida': row['bitacora.hmetro_salida'],
            'bitacora.hmetro_llegada': row['bitacora.hmetro_llegada'],
            'bitacora.hbomba_salida': row['bitacora.hbomba_salida'],
            'bitacora.hbomba_llegada': row['bitacora.hbomba_llegada'],
            'bitacora.obs': row['bitacora.obs'],
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
            tipo_mantencion_id: row.tipo_mantencion_id
        }));        

        // Responder con los resultados formateados
        res.json(result);

    } catch (error) {
        console.error('Error: ', error);
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
                ma.img_url AS 'img_url',
                ma.patente AS 'patente',    
                ma.nombre AS 'maquina.nombre',
                DATE_FORMAT(m.fec_inicio, '%d-%m-%Y') AS 'fec_inicio',
                DATE_FORMAT(m.fec_termino, '%d-%m-%Y') AS 'fec_termino',
                m.ord_trabajo,
                m.n_factura,
                m.cost_ser,
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
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Mantención no encontrada" });
        }

        const result = rows.map(row => ({
            id: row.id,
            'bitacora.id': row['bitacora.id'],
            'bitacora.compania': row['bitacora.compania'],
            'bitacora.conductor': row['bitacora.conductor'],
            'bitacora.direccion': row['bitacora.direccion'],
            'bitacora.fh_salida': row['bitacora.fh_salida'],
            'bitacora.fh_llegada': row['bitacora.fh_llegada'],
            'bitacora.km_salida': row['bitacora.km_salida'],
            'bitacora.km_llegada': row['bitacora.km_llegada'],
            'bitacora.hmetro_salida': row['bitacora.hmetro_salida'],
            'bitacora.hmetro_llegada': row['bitacora.hmetro_llegada'],
            'bitacora.hbomba_salida': row['bitacora.hbomba_salida'],
            'bitacora.hbomba_llegada': row['bitacora.hbomba_llegada'],
            'bitacora.obs': row['bitacora.obs'],
            patente: row.patente,
            fec_inicio: row.fec_inicio,
            fec_termino: row.fec_termino,
            ord_trabajo: row.ord_trabajo,
            n_factura: row.n_factura,
            cost_ser: row.cost_ser,
            taller: row.taller,
            img_url: row.img_url,
            estado_mantencion: row.estado_mantencion,
            tipo_mantencion: row.tipo_mantencion,
            tipo_mantencion_id: row.tipo_mantencion_id
        }));     

        res.json(result);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message,
        });
    }
};

// Crear mantenciones con todo (bitacora incluida)
export const createMantencionBitacora = async (req, res) => {
    let {
        "bitacora.compania_id": compania_id,
        "bitacora.personal_id": personal_id,
        "bitacora.direccion": direccion,
        "bitacora.f_salida": f_salida,
        "bitacora.h_salida": h_salida,
        "bitacora.clave_id": clave_id,
        "bitacora.km_salida": km_salida,
        "bitacora.km_llegada": km_llegada,
        "bitacora.hmetro_salida": hmetro_salida,
        "bitacora.hmetro_llegada": hmetro_llegada,
        "bitacora.hbomba_salida": hbomba_salida,
        "bitacora.hbomba_llegada": hbomba_llegada,
        "bitacora.obs": obs,
        maquina_id,
        taller_id,
        estado_mantencion_id,
        tipo_mantencion_id,
        ord_trabajo,
        n_factura,
        cost_ser,
        fec_inicio,
        fec_termino
    } = req.body;

    const errors = []; // Arreglo para almacenar errores

    try {
        ord_trabajo = String(ord_trabajo).trim();
        
        // Concatenar fecha y hora para formatear como datetime
        let fh_salida = null;

        // Validar fechas y horas de salida
        if (f_salida && h_salida) {
            const error = validateDate(f_salida, h_salida);
            if (!error) {
                console.log(`${f_salida} ${h_salida}`);
                errors.push(`Fecha y hora de salida inválida: ${error}`);
            }
            fh_salida = `${f_salida} ${h_salida}`;
        }

        // si es que viene null
        if (f_salida === null || h_salida === null){
            fh_salida = null;
        }

        // Validación de datos de la bitácora
        const companiaIdNumber = parseInt(compania_id);
        const personalIdNumber = parseInt(personal_id);
        const maquinaIdNumber = parseInt(maquina_id);
        const claveIdNumber = parseInt(clave_id);

        if (
            isNaN(companiaIdNumber) ||
            isNaN(personalIdNumber) ||
            isNaN(maquinaIdNumber) ||
            isNaN(claveIdNumber) ||
            typeof direccion !== "string"
        ) {
            errors.push("Tipo de datos inválido en la bitácora");
        }

        // Verificar disponibilidad de la máquina
        const [maquinaDisponible] = await pool.query("SELECT disponible FROM maquina WHERE id = ? AND isDeleted = 0", [maquinaIdNumber]);
        if (maquinaDisponible.length === 0 || maquinaDisponible[0].disponible !== 1) {
            errors.push("La máquina no está disponible para mantenimiento");
        }

        // Verificar disponibilidad del personal
        const [personalDisponible] = await pool.query("SELECT disponible FROM personal WHERE id = ? AND isDeleted = 0", [personalIdNumber]);
        if (personalDisponible.length === 0 || personalDisponible[0].disponible !== 1) {
            errors.push("El personal no está disponible para la mantención");
        }

        // manejar la carga de archivos si existen
        let img_url = null;

        if (req.files) {
            const imagen = req.files.imagen ? req.files.imagen[0] : null;

            if (imagen) {
                try {
                    const imgData = await uploadFileToS3(imagen, "mantencion");
                    if (imgData && imgData.Location) {
                        img_url = imgData.Location;
                    } else {
                        errors.push("No se pudo obtener la URL de la imagen");
                    }
                } catch (error) {
                    errors.push("Error al subir la imagen", error.message);
                }
            }
        }

        // Validación de existencia de llaves foráneas para la bitácora
        const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [companiaIdNumber]);
        if (companiaExists.length === 0) {
            errors.push("Compañía no existe o está eliminada");
        }

        const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personalIdNumber]);
        if (personalExists.length === 0) {
            errors.push("Personal no existe o está eliminado");
        }

        const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquinaIdNumber]);
        if (maquinaExists.length === 0) {
            errors.push("Máquina no existe o está eliminada");
        }

        const [claveExists] = await pool.query("SELECT 1 FROM clave WHERE id = ? AND isDeleted = 0", [claveIdNumber]);
        if (claveExists.length === 0) {
            errors.push("Clave no existe o está eliminada");
        }

        // Validar compañia de la bitácora con la del personal
        const [companiaPersonal] = await pool.query("SELECT compania_id FROM personal WHERE id = ? AND compania_id = ? AND isDeleted = 0", [personalIdNumber, companiaIdNumber]);
        if (companiaPersonal.length === 0) {
            errors.push("Compania no coincide con la del personal");
        }

        // Validación de fecha y hora usando la función validateDate
        if (f_salida && h_salida && !validateDate(f_salida, h_salida)) {
            errors.push('El formato de la fecha o la hora de salida es inválido. Deben ser dd-mm-aaaa y HH:mm');
        }

        // Validación de fec_inicio usando validateDate
        let formattedFecInicio = null;
        if (fec_inicio) {
            if (!validateDate(fec_inicio)) {
                errors.push("El formato de la fecha de inicio es inválido. Debe ser dd-mm-yyyy");
            } else {
                const dateParts = fec_inicio.split("-");
                const [day, month, year] = dateParts.map(Number);
                formattedFecInicio = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
            }
        }

        // Validación de fec_termino usando validateDate
        let formattedFecTermino = null;
        if (fec_termino) {
            if (!validateDate(fec_termino)) {
                errors.push("El formato de la fecha de término es inválido. Debe ser dd-mm-yyyy");
            } else {
                const dateParts = fec_termino.split("-");
                const [day, month, year] = dateParts.map(Number);
                formattedFecTermino = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
            }
        }

        // Validación de km_salida, km_llegada, hmetro_salida, etc.
        const validateFields = [
            { field: km_salida, name: "km_salida" },
            { field: km_llegada, name: "km_llegada" },
            { field: hmetro_salida, name: "hmetro_salida" },
            { field: hmetro_llegada, name: "hmetro_llegada" },
            { field: hbomba_salida, name: "hbomba_salida" },
            { field: hbomba_llegada, name: "hbomba_llegada" }
        ];

        validateFields.forEach(({ field, name }) => {
            if (field === undefined || field === null) {
                errors.push(`${name} es obligatorio`);
            } else {
                const error = validateFloat(field);
                if (error) {
                    errors.push(`${name}: ${error}`);
                }
            }
        });

        // Validaciones para mantención
        const [tallerExists] = await pool.query("SELECT 1 FROM taller WHERE id = ? AND isDeleted = 0", [taller_id]);
        if (tallerExists.length === 0) {
            errors.push("Taller no existe o está eliminado");
        }

        const [estadoExists] = await pool.query("SELECT 1 FROM estado_mantencion WHERE id = ? AND isDeleted = 0", [estado_mantencion_id]);
        if (estadoExists.length === 0) {
            errors.push("Estado de mantención no existe");
        }

        const [tipoMantencionExists] = await pool.query("SELECT 1 FROM tipo_mantencion WHERE id = ? AND isDeleted = 0", [tipo_mantencion_id]);
        if (tipoMantencionExists.length === 0) {
            errors.push("Tipo de mantención no existe");
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Inserción de la bitácora en la base de datos
        const [bitacoraResult] = await pool.query(
            `INSERT INTO bitacora (
                compania_id, 
                personal_id, 
                maquina_id, 
                direccion,
                fh_salida, 
                clave_id, 
                km_salida, 
                km_llegada,
                hmetro_salida, 
                hmetro_llegada, 
                hbomba_salida, 
                hbomba_llegada, 
                obs, 
                isDeleted
            ) VALUES (
                ?, 
                ?, 
                ?, 
                ?, 
                STR_TO_DATE(?, '%d-%m-%Y %H:%i'),
                ?, 
                ?, 
                ?, 
                ?, 
                ?, 
                ?, 
                ?, 
                ?, 
                0
            )`,
            [
                companiaIdNumber, 
                personalIdNumber, 
                maquinaIdNumber, 
                direccion,
                fh_salida, 
                claveIdNumber, 
                km_salida, 
                km_llegada,
                hmetro_salida, 
                hmetro_llegada, 
                hbomba_salida, 
                hbomba_llegada, 
                obs || null
            ]
        );

        const bitacora_id = bitacoraResult.insertId;

        // Actualizar estado de la máquina y personal a "no disponible"
        await pool.query(
            `UPDATE maquina SET disponible = 0 WHERE id = ?`,
            [maquinaIdNumber]
        );

        await pool.query(
            `UPDATE personal SET disponible = 0 WHERE id = ?`,
            [personalIdNumber]
        );

        // Inserción en la tabla mantención
        const [mantencionResult] = await pool.query(
            `INSERT INTO mantencion (
                bitacora_id, maquina_id, ord_trabajo, n_factura, img_url,
                cost_ser, taller_id, estado_mantencion_id, tipo_mantencion_id, fec_inicio, fec_termino, isDeleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
                bitacora_id, maquina_id, ord_trabajo, n_factura || null, img_url,
                cost_ser || null, taller_id, estado_mantencion_id, tipo_mantencion_id,
                formattedFecInicio, formattedFecTermino
            ]
        );

        return res.status(201).json({ message: "Mantención creada exitosamente", mantencion_id: mantencionResult.insertId });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Crear nueva mantención (solo mantencion)
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
      } = req.body;
  
      const errors = [];
      const estado_mantencion_id = 1;
  
      // Validaciones de entrada
      if (isNaN(parseInt(bitacora_id))) errors.push('El ID de la bitácora es inválido');
      if (isNaN(parseInt(maquina_id))) errors.push('El ID de la máquina es inválido');
      if (isNaN(parseInt(taller_id))) errors.push('El ID del taller es inválido');
      if (isNaN(parseInt(tipo_mantencion_id))) errors.push('El ID del tipo de mantención es inválido');
      if (typeof ord_trabajo !== 'string') errors.push('El número de orden de trabajo debe ser una cadena de texto');
      if (n_factura && isNaN(parseInt(n_factura))) errors.push('El número de factura es inválido');
      if (cost_ser && isNaN(parseInt(cost_ser))) errors.push('El costo del servicio es inválido');
  
      // Validación de fechas
      const validateDate = (dateStr) => {
        const regex = /^\d{2}-\d{2}-\d{4}$/;
        return regex.test(dateStr);
      };
  
      if (fec_inicio && !validateDate(fec_inicio)) {
        errors.push("El formato de la fecha de inicio es inválido. Debe ser dd-mm-yyyy");
      }
  
      if (fec_termino && !validateDate(fec_termino)) {
        errors.push("El formato de la fecha de término es inválido. Debe ser dd-mm-yyyy");
      }
  
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Errores en los datos de entrada', errors });
      }
  
      // Validar existencia de la máquina y personal, y verificar si están disponibles
      const [maquinaDisponible] = await pool.query(
        "SELECT disponible FROM maquina WHERE id = ? AND isDeleted = 0",
        [maquina_id]
      );
      if (maquinaDisponible.length === 0 || maquinaDisponible[0].disponible !== 1) {
        errors.push("La máquina no está disponible para mantenimiento");
      }
  
      const [personalDisponible] = await pool.query(
        "SELECT disponible FROM personal WHERE id = ? AND isDeleted = 0",
        [req.body.personal_id]
      );
      if (personalDisponible.length === 0 || personalDisponible[0].disponible !== 1) {
        errors.push("El personal no está disponible para la mantención");
      }
  
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Errores en disponibilidad', errors });
      }
  
      // Actualizar estados de disponibilidad
      await pool.query("UPDATE maquina SET disponible = 0 WHERE id = ?", [maquina_id]);
      await pool.query("UPDATE personal SET disponible = 0 WHERE id = ?", [req.body.personal_id]);
  
      // Inserción en la base de datos
      const formattedFecInicio = fec_inicio
        ? fec_inicio.split('-').reverse().join('-')
        : null;
      const formattedFecTermino = fec_termino
        ? fec_termino.split('-').reverse().join('-')
        : null;
  
      const [result] = await pool.query(
        `INSERT INTO mantencion (
          bitacora_id, 
          maquina_id, 
          taller_id, 
          estado_mantencion_id, 
          tipo_mantencion_id, 
          fec_inicio, 
          fec_termino, 
          ord_trabajo, 
          n_factura, 
          cost_ser, 
          isDeleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          bitacora_id,
          maquina_id,
          taller_id,
          estado_mantencion_id,
          tipo_mantencion_id,
          formattedFecInicio,
          formattedFecTermino,
          ord_trabajo,
          n_factura || null,
          cost_ser || null,
        ]
      );
  
      return res.status(201).json({ id: result.insertId, message: "Mantención creada exitosamente" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
  };
  
// Eliminar mantencion (cambiar estado)
export const deleteMantencion = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("UPDATE mantencion SET isDeleted = 1 WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Mantención no encontrada" 
            });
        }
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: error.message 
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
        fec_termino
    } = req.body;

    const errors = []; // Array para capturar los errores

    try {
        // Verificar si la mantención existe (inicio)
        const [existing] = await pool.query("SELECT 1 FROM mantencion WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Mantención no encontrada" });
        }

        // Validación de existencia de llaves foráneas
        const foreignKeyValidations = [
            { field: 'bitacora_id', table: 'bitacora' },
            { field: 'maquina_id', table: 'maquina' },
            { field: 'taller_id', table: 'taller' },
            { field: 'estado_mantencion_id', table: 'estado_mantencion' },
            { field: 'tipo_mantencion_id', table: 'tipo_mantencion' }
        ];

        const updates = {};

        // Validaciones para llaves foráneas
        for (const { field, table } of foreignKeyValidations) {
            if (req.body[field] !== undefined) {
                const [result] = await pool.query(`SELECT 1 FROM ${table} WHERE id = ? AND isDeleted = 0`, [req.body[field]]);
                if (result.length === 0) {
                    errors.push(`${table.charAt(0).toUpperCase() + table.slice(1)} no existe o está eliminada`);
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
                errors.push("El formato de la fecha de 'fec_inicio' es inválido. Debe ser dd-mm-aaaa");
            } else {
                updates.fec_inicio = fec_inicio;
            }
        }

        // Validar y agregar fec_termino
        if (fec_termino !== undefined) {
            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            if (!fechaRegex.test(fec_termino)) {
                errors.push("El formato de la fecha de 'fec_termino' es inválido. Debe ser dd-mm-aaaa");
            } else {
                updates.fec_termino = fec_termino;
            }
        }

        // Validar y agregar isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
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
                if (key === 'fec_inicio' || key === 'fec_termino') {
                    return `${key} = STR_TO_DATE(?, '%d-%m-%Y')`;
                }
                return `${key} = ?`;
            })
            .join(", ");
        
        if (!setClause) {
            errors.push("No se proporcionaron campos para actualizar");
            console.log(errors)
            return res.status(400).json({ errors });
        }

        // Preparar los valores para la actualización
        const values = Object.keys(updates).map(key => {
            if (key === 'fec_inicio' || key === 'fec_termino') {
                return req.body[key];
            }
            return updates[key];
        }).concat(id);
        
        // Realizar la actualización
        const [result] = await pool.query(`UPDATE mantencion SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            // errors.push();
            return res.status(404).json({ message: "Mantención no encontrada" });
        }

        // Obtener y devolver el registro actualizado
        const [rows] = await pool.query("SELECT * FROM mantencion WHERE id = ?", [id]);
        res.json(rows[0]);
    } catch (error) {
        console.error("Error al actualizar mantención: ", error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Nueva función para actualizar el estado de una mantención
export const updateMaintenanceStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { estado_mantencion_id } = req.body;
  
      // Verificar que el estado existe
      const [estados] = await pool.query(
        'SELECT id FROM estado_mantencion WHERE id = ? AND isDeleted = 0',
        [estado_mantencion_id]
      );
  
      if (estados.length === 0) {
        return res.status(400).json({ message: 'El estado de mantención no existe' });
      }
  
      // Actualizar el estado
      await pool.query(
        'UPDATE mantencion SET estado_mantencion_id = ? WHERE id = ? AND isDeleted = 0',
        [estado_mantencion_id, id]
      );
  
      res.json({ message: 'Estado de mantención actualizado correctamente' });
    } catch (error) {
        console.log(error.message)
      res.status(500).json({ message: error.message });
    }
  }

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