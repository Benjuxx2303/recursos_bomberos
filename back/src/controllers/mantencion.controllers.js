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
        `;

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

        // Si se proporciona "page", se aplica paginación
        if (page) {
            const currentPage = parseInt(page) || 1; // Página actual, por defecto 1
            const currentPageSize = parseInt(pageSize) || 10; // Página tamaño, por defecto 10
            const offset = (currentPage - 1) * currentPageSize; // Calcular el offset para la consulta

            // Añadir LIMIT y OFFSET a la consulta
            query += ' LIMIT ? OFFSET ?';
            params.push(currentPageSize, offset);
        }

        // Ejecutar la consulta con los parámetros
        const [rows] = await pool.query(query, params);

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!page) {
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Mapeo de resultados a la estructura deseada
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
            tipo_mantencion_id: row.tipo_mantencion_id
        }));

        // Responder con los resultados paginados
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
        fec_termino,
        tipo_mantencion_id
    } = req.body;

    // Extraer los datos de la bitácora
    const {
        compania_id,
        personal_id,
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
            return res.status(400).json({ message: "Tipo de datos inválido en la bitácora" });
        }

        // Validación de existencia de llaves foráneas para la bitácora
        const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [companiaIdNumber]);
        if (companiaExists.length === 0) {
            return res.status(400).json({ message: "Compañía no existe o está eliminada" });
        }

        const [personalExists] = await pool.query("SELECT 1 FROM personal_id WHERE id = ? AND isDeleted = 0", [personalIdNumber]);
        if (personalExists.length === 0) {
            return res.status(400).json({ message: "Personal no existe o está eliminado" });
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
                companiaIdNumber, personalIdNumber, maquinaIdNumber, direccion,
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
                cost_ser, taller_id, estado_mantencion_id, tipo_mantencion_id, fec_inicio, fec_termino, isDeleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
                bitacora_id, maquina_id, ord_trabajo, n_factura,
                cost_ser, taller_id, estado_mantencion_id, tipo_mantencion_id, formattedFecInicio, formattedFecTermino || null
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
      tipo_mantencion_id
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
        "INSERT INTO mantencion (bitacora_id, maquina_id, taller_id, estado_mantencion_id,tipo_mantencion_id, fec_inicio, fec_termino, ord_trabajo, n_factura, img_url, cost_ser, isDeleted) VALUES (?, ?, ?, ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, ?, ?, 0)",
        [
          bitacora_id,
          maquina_id,
          taller_id,
          estado_mantencion_id,
          tipo_mantencion_id,
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
