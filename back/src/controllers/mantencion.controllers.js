import { pool } from "../db.js";
import {
    uploadFileToS3,
    updateImageUrlInDb,
    handleError
  } from './fileUpload.js';

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
                em.nombre AS 'estado_mantencion'
            FROM mantencion m
            INNER JOIN bitacora b ON m.bitacora_id = b.id
            INNER JOIN compania c ON b.compania_id = c.id
            INNER JOIN maquina ma ON m.maquina_id = ma.id
            INNER JOIN conductor_maquina cm ON b.conductor_id = cm.id
            INNER JOIN personal p ON cm.personal_id = p.id
            INNER JOIN taller t ON m.taller_id = t.id
            INNER JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
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
        }));

        res.json(result);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message,
        });
    }
};

// con parametros de busqueda
export const getMantencionesAllDetailsSearch = async (req, res) => {
    try {
        const { taller, estado_mantencion, ord_trabajo, compania } = req.query;

        // Iniciar la consulta SQL base
        let query = `
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
                em.nombre AS 'estado_mantencion'
            FROM mantencion m
            INNER JOIN bitacora b ON m.bitacora_id = b.id
            INNER JOIN compania c ON b.compania_id = c.id
            INNER JOIN maquina ma ON m.maquina_id = ma.id
            INNER JOIN conductor_maquina cm ON b.conductor_id = cm.id
            INNER JOIN personal p ON cm.personal_id = p.id
            INNER JOIN taller t ON m.taller_id = t.id
            INNER JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            WHERE m.isDeleted = 0 AND b.isDeleted = 0
        `;

        // Array para almacenar los parámetros a inyectar
        const params = [];

        if (taller) {
            query += ' AND t.nombre = ?';
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

        // Ejecutar la consulta con los parámetros
        const [rows] = await pool.query(query, params);

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
            fec_inicio: row.fec_inicio,
            fec_termino: row.fec_termino,
            ord_trabajo: row.ord_trabajo,
            n_factura: row.n_factura,
            img_url: row.img_url,
            cost_ser: row.cost_ser,
            taller: row.taller,
            estado_mantencion: row.estado_mantencion,
        }));

        res.json(result);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message,
        });
    }
};

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
                ma.patente AS 'patente',
                DATE_FORMAT(m.fec_inicio, '%d-%m-%Y') AS 'fec_inicio',
                DATE_FORMAT(m.fec_termino, '%d-%m-%Y') AS 'fec_termino',
                m.ord_trabajo,
                m.n_factura,
                m.img_url,
                m.cost_ser,
                t.nombre AS 'taller',
                em.nombre AS 'estado_mantencion'
            FROM mantencion m
            INNER JOIN bitacora b ON m.bitacora_id = b.id
            INNER JOIN compania c ON b.compania_id = c.id
            INNER JOIN maquina ma ON m.maquina_id = ma.id
            INNER JOIN conductor_maquina cm ON b.conductor_id = cm.id
            INNER JOIN personal p ON cm.personal_id = p.id
            INNER JOIN taller t ON m.taller_id = t.id
            INNER JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            WHERE m.isDeleted = 0 AND b.isDeleted = 0 AND m.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Mantención no encontrada" });
        }

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
            fec_inicio: row.fec_inicio,
            fec_termino: row.fec_termino,
            ord_trabajo: row.ord_trabajo,
            n_factura: row.n_factura,
            img_url: row.img_url,
            cost_ser: row.cost_ser,
            taller: row.taller,
            estado_mantencion: row.estado_mantencion,
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
    const {
        bitacora,
        maquina_id,
        ord_trabajo,
        n_factura,
        cost_ser,
        taller_id,
        estado_mantencion_id,
        fec_inicio,
        fec_termino
    } = req.body;

    // Extraer los datos de la bitácora
    const {
        compania_id,
        conductor_id,
        direccion,
        f_salida,
        h_salida,
        f_llegada,
        h_llegada,
        clave_id,
        km_salida,
        km_llegada,
        hmetro_salida,
        hmetro_llegada,
        hbomba_salida,
        hbomba_llegada,
        obs
    } = bitacora;

    try {
        // Concatenar fecha y hora para formatear como datetime
        let fh_salida = null;
        let fh_llegada = null;

        if (f_salida && h_salida) {
            fh_salida = `${f_salida} ${h_salida}`;
        }
        if (f_llegada && h_llegada) {
            fh_llegada = `${f_llegada} ${h_llegada}`;
        }

        // Validación de datos de la bitácora
        const companiaIdNumber = parseInt(compania_id);
        const conductorIdNumber = parseInt(conductor_id);
        const maquinaIdNumber = parseInt(maquina_id);
        const claveIdNumber = parseInt(clave_id);

        if (
            isNaN(companiaIdNumber) ||
            isNaN(conductorIdNumber) ||
            isNaN(maquinaIdNumber) ||
            isNaN(claveIdNumber) ||
            typeof direccion !== "string"
        ) {
            return res.status(400).json({ message: "Tipo de datos inválido en la bitácora" });
        }

        // Validación de existencia de llaves foráneas para la bitácora
        const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [companiaIdNumber]);
        if (companiaExists.length === 0) {
            return res.status(400).json({ message: "Compañía no existe o está eliminada" });
        }

        const [conductorExists] = await pool.query("SELECT 1 FROM conductor_maquina WHERE id = ? AND isDeleted = 0", [conductorIdNumber]);
        if (conductorExists.length === 0) {
            return res.status(400).json({ message: "Conductor no existe o está eliminado" });
        }

        const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquinaIdNumber]);
        if (maquinaExists.length === 0) {
            return res.status(400).json({ message: "Máquina no existe o está eliminada" });
        }

        const [claveExists] = await pool.query("SELECT 1 FROM clave WHERE id = ? AND isDeleted = 0", [claveIdNumber]);
        if (claveExists.length === 0) {
            return res.status(400).json({ message: "Clave no existe o está eliminada" });
        }

        // Validación de fecha y hora si están presentes
        const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
        const horaRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

        if (f_salida && h_salida && (!fechaRegex.test(f_salida) || !horaRegex.test(h_salida))) {
            return res.status(400).json({
                message: 'El formato de la fecha o la hora de salida es inválido. Deben ser dd-mm-aaaa y HH:mm'
            });
        }

        if (f_llegada && h_llegada && (!fechaRegex.test(f_llegada) || !horaRegex.test(h_llegada))) {
            return res.status(400).json({
                message: 'El formato de la fecha o la hora de llegada es inválido. Deben ser dd-mm-aaaa y HH:mm'
            });
        }

        // Validación de valores numéricos para los kilómetros y otros campos
        const kmSalida = parseFloat(km_salida);
        const kmLlegada = parseFloat(km_llegada);
        const hmetroSalida = parseFloat(hmetro_salida);
        const hmetroLlegada = parseFloat(hmetro_llegada);
        const hbombaSalida = parseFloat(hbomba_salida);
        const hbombaLlegada = parseFloat(hbomba_llegada);

        if (
            isNaN(kmSalida) || kmSalida < 0 ||
            isNaN(kmLlegada) || kmLlegada < 0 ||
            isNaN(hmetroSalida) || hmetroSalida < 0 ||
            isNaN(hmetroLlegada) || hmetroLlegada < 0 ||
            isNaN(hbombaSalida) || hbombaSalida < 0 ||
            isNaN(hbombaLlegada) || hbombaLlegada < 0
        ) {
            return res.status(400).json({ message: "Los valores no pueden ser negativos" });
        }

        // Inserción de la bitácora en la base de datos
        const [bitacoraResult] = await pool.query(
            `INSERT INTO bitacora (
                compania_id, conductor_id, maquina_id, direccion,
                fh_salida, fh_llegada, clave_id, km_salida, km_llegada,
                hmetro_salida, hmetro_llegada, hbomba_salida, hbomba_llegada, obs, isDeleted
            ) VALUES (
                ?, ?, ?, ?, STR_TO_DATE(?, "%d-%m-%Y %H:%i"),
                STR_TO_DATE(?, "%d-%m-%Y %H:%i"), ?, ?, ?, ?, ?, ?, ?, ?, 0
            )`,
            [
                companiaIdNumber, conductorIdNumber, maquinaIdNumber, direccion,
                fh_salida, fh_llegada, claveIdNumber, kmSalida, kmLlegada,
                hmetroSalida, hmetroLlegada, hbombaSalida, hbombaLlegada, obs || null
            ]
        );

        const bitacora_id = bitacoraResult.insertId;

        // Validaciones para mantención
        const [tallerExists] = await pool.query("SELECT 1 FROM taller WHERE id = ? AND isDeleted = 0", [taller_id]);
        if (tallerExists.length === 0) {
            return res.status(400).json({ message: "Taller no existe o está eliminado" });
        }

        const [estadoExists] = await pool.query("SELECT 1 FROM estado_mantencion WHERE id = ? AND isDeleted = 0", [estado_mantencion_id]);
        if (estadoExists.length === 0) {
            return res.status(400).json({ message: "Estado de mantención no existe" });
        }

        // Validar y formatear fec_termino si está presente
        let formattedFecTermino = null;
        if (fec_termino) {
            if (!fechaRegex.test(fec_termino)) {
                return res.status(400).json({
                    message: "El formato de la fecha es inválido. Debe ser dd-mm-yyyy"
                });
            }

            const dateParts = fec_termino.split("-");
            const [day, month, year] = dateParts.map(Number);
            formattedFecTermino = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        }

        // Validar y formatear fec_inicio si está presente
        let formattedFecInicio = null;
        if (fec_inicio) {
            if (!fechaRegex.test(fec_inicio)) {
                return res.status(400).json({
                    message: "El formato de la fecha es inválido. Debe ser dd-mm-yyyy"
                });
            }

            const dateParts = fec_inicio.split("-");
            const [day, month, year] = dateParts.map(Number);
            formattedFecInicio = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        }

        // validar el costo del servicio solo si existe el "n_factura"
        if (n_factura) {
            if (n_factura <= 0) {
                return res.status(400).json({ message: "El número de factura no es válido" });
            }

            if (cost_ser === undefined || cost_ser === null) {
                return res.status(400).json({ message: "El costo del servicio es obligatorio cuando se proporciona un número de factura" });
            }

            if (cost_ser <= 0) {
                return res.status(400).json({ message: "El costo no puede ser negativo o menor a cero" });
            }
        } else if (cost_ser) {
            return res.status(400).json({ message: "Debe ingresar el número de factura primero" });
        }

        // Inserción en la tabla mantención
        const [mantencionResult] = await pool.query(
            `INSERT INTO mantencion (
                bitacora_id, maquina_id, ord_trabajo, n_factura,
                cost_ser, taller_id, estado_mantencion_id, fec_inicio, fec_termino, isDeleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
                bitacora_id, maquina_id, ord_trabajo, n_factura,
                cost_ser, taller_id, estado_mantencion_id, formattedFecInicio, formattedFecTermino || null
            ]
        );

        res.status(201).json({
            mantencion_id: mantencionResult.insertId,
            bitacora_id,
            maquina_id,
            ord_trabajo,
            n_factura,
            cost_ser,
            taller_id,
            estado_mantencion_id,
            fec_inicio: formattedFecInicio,
            fec_termino: formattedFecTermino
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error en la creación de la mantención y bitácora", error: error.message });
    }
};

// Crear nueva mantención (solo mantencion)
export const createMantencion = async (req, res) => {
    const {
      bitacora_id,
      maquina_id,
      taller_id,
      estado_mantencion_id,
      fec_inicio,
      fec_termino,
      ord_trabajo,
      n_factura,
      img_url,
      cost_ser,
    } = req.body;
  
    try {
      // Validaciones de tipo de datos
      if (
        isNaN(parseInt(bitacora_id)) ||
        isNaN(parseInt(maquina_id)) ||
        isNaN(parseInt(taller_id)) ||
        isNaN(parseInt(estado_mantencion_id)) ||
        typeof ord_trabajo !== 'string' ||
        (n_factura && isNaN(parseInt(n_factura))) ||
        (cost_ser && isNaN(parseInt(cost_ser)))
      ) {
        return res.status(400).json({ message: 'Tipo de datos inválido' });
      }
  
      // Validación de llaves foráneas
      const [bitacora] = await pool.query("SELECT * FROM bitacora WHERE id = ? AND isDeleted = 0", [bitacora_id]);
      if (bitacora.length === 0) return res.status(400).json({ message: 'Bitácora no existe' });
  
      const [maquina] = await pool.query("SELECT * FROM maquina WHERE id = ? AND isDeleted = 0", [maquina_id]);
      if (maquina.length === 0) return res.status(400).json({ message: 'Máquina no existe' });
  
      const [taller] = await pool.query("SELECT * FROM taller WHERE id = ? AND isDeleted = 0", [taller_id]);
      if (taller.length === 0) return res.status(400).json({ message: 'Taller no existe' });
  
      const [estadoMantencion] = await pool.query("SELECT * FROM estado_mantencion WHERE id = ? AND isDeleted = 0", [estado_mantencion_id]);
      if (estadoMantencion.length === 0) return res.status(400).json({ message: 'Estado de mantención no existe' });
  
      // Validación de fechas
      const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      const fechas = [fec_inicio, fec_termino];
      for (const fecha of fechas) {
        if (fecha && !fechaRegex.test(fecha)) {
          return res.status(400).json({ message: 'Formato de fecha inválido. Debe ser dd-mm-aaaa' });
        }
      }
  
      // Inserción en la base de datos
      const [rows] = await pool.query(
        "INSERT INTO mantencion (bitacora_id, maquina_id, taller_id, estado_mantencion_id, fec_inicio, fec_termino, ord_trabajo, n_factura, img_url, cost_ser, isDeleted) VALUES (?, ?, ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, ?, ?, 0)",
        [
          bitacora_id,
          maquina_id,
          taller_id,
          estado_mantencion_id,
          fec_inicio,
          fec_termino,
          ord_trabajo,
          n_factura || null, // Si no hay número de factura, lo dejamos como null
          img_url || null, // Si no hay imagen, lo dejamos como null
          cost_ser || null, // Si no hay costo de servicio, lo dejamos como null
        ]
      );
  
      res.status(201).json({ id: rows.insertId, ...req.body });
    } catch (error) {
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
                message: "Mantencion no encontrada" 
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
        isDeleted,
        fec_inicio, // Nueva columna
        fec_termino
    } = req.body;

    try {
        // Validación de existencia de llaves foráneas
        const foreignKeyValidations = [
            { field: 'bitacora_id', table: 'bitacora' },
            { field: 'maquina_id', table: 'maquina' },
            { field: 'taller_id', table: 'taller' },
            { field: 'estado_mantencion_id', table: 'estado_mantencion' }
        ];

        const updates = {};

        // Validaciones para llaves foráneas
        for (const { field, table } of foreignKeyValidations) {
            if (req.body[field] !== undefined) {
                const [result] = await pool.query(`SELECT 1 FROM ${table} WHERE id = ? AND isDeleted = 0`, [req.body[field]]);
                if (result.length === 0) {
                    return res.status(400).json({ message: `${table.charAt(0).toUpperCase() + table.slice(1)} no existe o está eliminada` });
                }
                updates[field] = req.body[field];
            }
        }

        // Validaciones para los campos específicos
        if (ord_trabajo !== undefined) {
            if (typeof ord_trabajo !== "string") {
                return res.status(400).json({ message: "Tipo de dato inválido para 'ord_trabajo'" });
            }
            updates.ord_trabajo = ord_trabajo;
        }

        if (n_factura !== undefined) {
            if (typeof n_factura !== "number") {
                return res.status(400).json({ message: "Tipo de dato inválido para 'n_factura'" });
            }
            updates.n_factura = n_factura;
        }

        if (cost_ser !== undefined) {
            if (typeof cost_ser !== "number") {
                return res.status(400).json({ message: "Tipo de dato inválido para 'cost_ser'" });
            }
            updates.cost_ser = cost_ser;
        }

        // Validar y agregar fec_inicio
        if (fec_inicio !== undefined) {
            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            if (!fechaRegex.test(fec_inicio)) {
                return res.status(400).json({ message: "El formato de la fecha es inválido. Debe ser dd-mm-aaaa" });
            }
            updates.fec_inicio = fec_inicio;  // Pasar solo el valor, sin STR_TO_DATE
        }

        // Validar y agregar fec_termino
        if (fec_termino !== undefined) {
            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            if (!fechaRegex.test(fec_termino)) {
                return res.status(400).json({
                    message: 'El formato de la fecha es inválido. Debe ser dd-mm-aaaa'
                });
            }
            updates.fec_termino = fec_termino;  // Pasar solo el valor, sin STR_TO_DATE
        }

        // Validar y agregar isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                return res.status(400).json({
                    message: "Tipo de dato inválido para 'isDeleted'"
                });
            }
            updates.isDeleted = isDeleted;
        }

        // Verificar si la mantención existe
        const [existing] = await pool.query("SELECT 1 FROM mantencion WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Mantención no encontrada" });
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
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar"
            });
        }
        
        
        // Preparar los valores para la actualización
        const values = Object.keys(updates).map(key => {
            if (key === 'fec_inicio' || key === 'fec_termino') {
                return req.body[key];
            }
            return updates[key];
        }).concat(id);
        
        // Mostrar valores que se están actualizando
        // console.log("SET clause generada: ", setClause);
        // console.log("Valores para actualizar: ", updates);
        // console.log("Valores a enviar a la base de datos: ", values);

        // Realizar la actualización
        const [result] = await pool.query(`UPDATE mantencion SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Mantención no encontrada"
            });
        }

        // Obtener y devolver el registro actualizado
        const [rows] = await pool.query("SELECT * FROM mantencion WHERE id = ?", [id]);
        res.json(rows[0]);
    } catch (error) {
        console.error("Error al actualizar mantención: ", error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

const value = "mantencion";
const folder=value;
const tableName=value;

export const updateImage = async (req, res) => {
    const { id } = req.params;
    const file = req.file;

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


// -----------------------------------Reportes
export const getMantencionCostosByAnio = async (req, res) => {
    const { year } = req.query; //filtra por año en "fec_inicio"

    // Validación del año
    if (!/^\d{4}$/.test(year)) {
        return res.status(400).json({ message: "El año debe ser un número de 4 dígitos" });
    }

    // Arreglo con los nombres de los meses en español
    const mesesNombre = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    try {
        const [rows] = await pool.query(`
            SELECT 
                MONTH(m.fec_inicio) AS mes,  -- Usamos fec_inicio en lugar de fh_salida
                SUM(m.cost_ser) AS costoTotal,
                COUNT(m.id) AS totalMantenciones
            FROM 
                mantencion m
            WHERE 
                YEAR(m.fec_inicio) = ?  -- Filtramos por el año de fec_inicio
            GROUP BY 
                MONTH(m.fec_inicio)
            ORDER BY 
                mes
        `, [year]);

        // Formatear la respuesta
        const result = {
            year: parseInt(year),
            meses: []
        };

        // Rellenar los meses con 0 si no hay datos
        for (let i = 1; i <= 12; i++) {
            const mesData = rows.find(row => row.mes === i) || { mes: i, costoTotal: 0, totalMantenciones: 0 };
            result.meses.push({
                mes: mesesNombre[mesData.mes - 1], // Convertir el número del mes al nombre
                costoTotal: mesData.costoTotal,
                totalMantenciones: mesData.totalMantenciones
            });
        }
        
        res.json(result);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message // Captura el mensaje de error
        });
    }
};




// stats
// stats
export const getReporteMantencionesEstadoCosto = async (req, res) => {
    const { startDate, endDate, companiaId } = req.query; // startDate y endDate filtra por "fec_inicio"

    // Validación de fechas con expresión regular
    const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: "Se requieren startDate y endDate en formato dd-mm-yyyy." });
    }

    if (!fechaRegex.test(startDate) || !fechaRegex.test(endDate)) {
        return res.status(400).json({
            message: 'El formato de la fecha es inválido. Debe ser dd-mm-aaaa'
        });
    }

    // Validación de companiaId (si se proporciona)
    if (companiaId) {
        const companiaIdNumber = parseInt(companiaId, 10);

        if (isNaN(companiaIdNumber)) {
            return res.status(400).json({ message: "companiaId debe ser un número válido." });
        }

        try {
            // Verificar que la compañia exista y no esté eliminada
            const [companiaExists] = await pool.query(
                "SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0",
                [companiaIdNumber]
            );

            if (companiaExists.length === 0) {
                return res.status(400).json({ message: "Compañía no existe o está eliminada." });
            }
        } catch (error) {
            return res.status(500).json({ message: "Error interno al verificar la compañía.", error: error.message });
        }
    }

    try {
        // Comenzar a construir la consulta para estadoMensual (solo aplica startDate, endDate y companiaId)
        let query = `
            SELECT 
                YEAR(m.fec_inicio) AS year,          -- Obtener el año de fec_inicio
                MONTH(m.fec_inicio) AS month,        -- Obtener el mes de fec_inicio
                em.nombre AS estado_mantencion,
                COUNT(m.id) AS count,
                SUM(m.cost_ser) AS cost
            FROM mantencion m
            JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            JOIN bitacora b ON m.bitacora_id = b.id      -- Relación con bitacora para obtener compania_id
            WHERE m.isDeleted = 0 
                AND m.fec_inicio BETWEEN STR_TO_DATE(?, '%d-%m-%Y') AND STR_TO_DATE(?, '%d-%m-%Y')
                AND m.fec_termino BETWEEN STR_TO_DATE(?, '%d-%m-%Y') AND STR_TO_DATE(?, '%d-%m-%Y')
        `;

        const params = [startDate, endDate, startDate, endDate];

        if (companiaId) {
            query += " AND b.compania_id = ?";  // Filtro por compania_id en bitacora
            params.push(companiaId);
        }

        query += `
            GROUP BY year, month, em.nombre
            ORDER BY year, month
        `;

        // Ejecutar la consulta para obtener el reporte mensual
        const [rows] = await pool.query(query, params);

        // Formatear la respuesta para el reporte mensual
        const report = {};

        rows.forEach(row => {
            const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(row.year, row.month - 1)).toLowerCase();

            if (!report[row.year]) {
                report[row.year] = {};
            }

            if (!report[row.year][monthName]) {
                report[row.year][monthName] = {};
            }

            const estadoLowerCase = row.estado_mantencion.toLowerCase();
            report[row.year][monthName][estadoLowerCase] = {
                count: row.count,
                cost: row.cost
            };
        });

        // Agregar tipos de mantenciones al reporte (sin filtros de fecha ni companiaId)
        let tiposMantencionesQuery = `
            SELECT 
                tm.nombre AS tipo_mantencion,
                COUNT(dm.id) AS cantidad
            FROM detalle_mantencion dm
            JOIN tipo_mantencion tm ON dm.tipo_mantencion_id = tm.id
            JOIN mantencion m ON dm.mantencion_id = m.id
            JOIN bitacora b ON m.bitacora_id = b.id      -- Relación con bitacora para obtener compania_id
            WHERE m.isDeleted = 0
        `;

        if (companiaId) {
            tiposMantencionesQuery += " AND b.compania_id = ?";  // Filtro por compania_id en bitacora
        }

        const [tiposRows] = await pool.query(tiposMantencionesQuery, companiaId ? [companiaId] : []);

        const totalMantenciones = tiposRows.reduce((sum, row) => sum + row.cantidad, 0);
        const tiposMantenciones = {};

        tiposRows.forEach(row => {
            tiposMantenciones[row.tipo_mantencion] = {
                cantidad: row.cantidad,
                porcentaje: (row.cantidad / totalMantenciones).toFixed(2)
            };
        });

        // Agregar estado de flota al reporte (sin filtros de fecha ni companiaId)
        let estadoFlotaQuery = `
            SELECT 
                m.disponible,
                COUNT(m.id) AS cantidad
            FROM maquina m
            WHERE m.isDeleted = 0
        `;
        
        if (companiaId) {
            estadoFlotaQuery += " AND m.compania_id = ?";  // Filtro por compania_id en maquina
        }

        const [flotaRows] = await pool.query(estadoFlotaQuery, companiaId ? [companiaId] : []);

        const estadoFlota = {
            disponible: {
                cantidad: 0,
                porcentaje: 0
            },
            noDisponible: {
                cantidad: 0,
                porcentaje: 0
            }
        };

        flotaRows.forEach(row => {
            const estado = row.disponible === 1 ? 'disponible' : 'noDisponible';
            estadoFlota[estado].cantidad = row.cantidad;
        });

        // Calcular los porcentajes de la flota
        const totalFlota = estadoFlota.disponible.cantidad + estadoFlota.noDisponible.cantidad;
        if (totalFlota > 0) {
            estadoFlota.disponible.porcentaje = (estadoFlota.disponible.cantidad / totalFlota).toFixed(2);
            estadoFlota.noDisponible.porcentaje = (estadoFlota.noDisponible.cantidad / totalFlota).toFixed(2);
        }

        // Responder con todos los datos
        res.json({
            estadoMensual: report,
            tiposMantenciones: tiposMantenciones,
            estadoFlota: estadoFlota
        });
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};


// dashboardSummary (mes actual)
export const getReporteGeneral = async (req, res) => {
    // Obtener la fecha actual para hacer comparaciones
    const fechaHoy = new Date();
    const fechaFinMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() + 1, 0); // Último día del mes

    // Definir los sinónimos de los estados
    const estados = {
        abiertas: ['abierta', 'en proceso', 'pendiente'], // Los sinónimos de "abierta"
        completadas: ['cerrada', 'terminada', 'finalizada', 'completada'], // Los sinónimos de "completada"
        atrasadas: ['atrasada', 'vencida'] // Los sinónimos de "atrasada"
    };

    try {
        // Contar el total de máquinas
        const [totalMaquinasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM maquina
        `);
        const totalMaquinas = totalMaquinasRows[0].total;

        // Contar las máquinas activas
        const [maquinasActivasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM maquina
            WHERE isDeleted = 0
        `);
        const maquinasActivas = maquinasActivasRows[0].total;

        // Contar las máquinas disponibles (disponible = 1)
        const [maquinasDisponiblesRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM maquina
            WHERE disponible = 1 AND isDeleted = 0
        `);
        const maquinasDisponibles = maquinasDisponiblesRows[0].total;

        // Calcular el porcentaje de flota disponible
        const flotaDisponible = maquinasActivas > 0 ? (maquinasDisponibles / maquinasActivas) * 100 : 0;

        // Contar mantenciones programadas para el resto del mes
        const [mantencionesProximasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM mantencion m
            JOIN bitacora b ON m.bitacora_id = b.id
            WHERE m.isDeleted = 0
              AND m.fec_termino BETWEEN CURDATE() AND ?
        `, [fechaFinMes]);

        const mantencionesProximas = mantencionesProximasRows[0].total;

        // Contar mantenciones abiertas
        const estadosAbiertos = estados.abiertas.join("','"); // Unir los sinónimos de "abierta"
        const [mantencionesAbiertasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM mantencion m
            JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            WHERE em.nombre IN ('${estadosAbiertos}')
              AND m.isDeleted = 0
        `);
        const mantencionesAbiertas = mantencionesAbiertasRows[0].total;

        // Contar mantenciones completadas este mes
        const estadosCompletadas = estados.completadas.join("','"); // Unir los sinónimos de "completada"
        const [mantencionesCompletadasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM mantencion m
            JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            WHERE em.nombre IN ('${estadosCompletadas}')
              AND m.isDeleted = 0
              AND MONTH(m.fec_termino) = MONTH(CURDATE())
              AND YEAR(m.fec_termino) = YEAR(CURDATE())
        `);
        const mantencionesCompletadas = mantencionesCompletadasRows[0].total;

        // Contar mantenciones atrasadas (fechas de término pasadas)
        const estadosAtrasadas = estados.atrasadas.join("','"); // Unir los sinónimos de "atrasada"
        const [mantencionesAtrasadasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM mantencion m
            JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            WHERE em.nombre IN ('${estadosAtrasadas}')
              AND m.isDeleted = 0
              AND m.fec_termino < CURDATE()
        `);
        const mantencionesAtrasadas = mantencionesAtrasadasRows[0].total;

        // Calcular el tiempo de resolución promedio de mantenciones
        const [tiempoResolucionRows] = await pool.query(`
            SELECT AVG(DATEDIFF(m.fec_termino, m.fec_inicio)) AS promedio
            FROM mantencion m
            WHERE m.isDeleted = 0
              AND m.fec_termino IS NOT NULL
        `);
        const tiempoResolucionPromedio = Math.round(tiempoResolucionRows[0].promedio) || 0;

        // Calcular el porcentaje de mantenciones preventivas (sin fec_termino pero con fec_inicio)
        const [mantencionesPreventivasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM mantencion m
            WHERE m.isDeleted = 0
              AND (m.fec_termino IS NULL OR m.fec_termino = '')
              AND m.fec_inicio IS NOT NULL
        `);
        const mantencionesPreventivas = mantencionesPreventivasRows[0].total;
        const porcentajePreventivas = totalMaquinas > 0 ? (mantencionesPreventivas / totalMaquinas) * 100 : 0;

        // Devolver el reporte completo
        const reporte = {
            totalMaquinas,
            maquinasActivas, // flota disponible (isDeleted = 0)
            mantencionesProximas, // mantenciones programadas para el resto del mes
            mantencionesAbiertas, // mantenciones en proceso en este momento ("abierta"; "en proceso")
            mantencionesCompletadas, // mantenciones completadas este mes ("cerrada";"terminada")
            mantencionesAtrasadas, // mantenciones vencidas ("atrasada"; "vencida"); fecha de término < hoy
            eficiencia: {
                tiempoResolucionPromedio, // Tiempo aproximado promedio , en que tarda en realizarse una mantención (en días); compara "fec_inicio" con "fec_termino"
                porcentajePreventivas, // Porcentaje de mantenciones preventivas (sin fecha de término pero con fecha de inicio)
                flotaDisponible // Porcentaje de flota disponible (máquinas disponibles / máquinas activas) ; porcentaje de máquinas disponibles frente al total de máquinas (comparar "disponible = 1" con "disponible = 0"; dividir las disponibles con la flota total (maquinas activas))
            }
        };

        res.json(reporte);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};