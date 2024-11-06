import { pool } from "../db.js";

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
                DATE_FORMAT(m.fec_termino, '%d-%m-%Y') AS 'fec_termino',
                m.ord_trabajo,
                m.n_factura,
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
            fec_termino: row.fec_termino,
            ord_trabajo: row.ord_trabajo,
            n_factura: row.n_factura,
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
                DATE_FORMAT(m.fec_termino, '%d-%m-%Y') AS 'fec_termino',
                m.ord_trabajo,
                m.n_factura,
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
            fec_termino: row.fec_termino,
            ord_trabajo: row.ord_trabajo,
            n_factura: row.n_factura,
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

// Crear mantencion
export const createMantencion = async (req, res) => {
    const {
        bitacora_id,
        maquina_id,
        ord_trabajo,
        n_factura,
        cost_ser,
        taller_id,
        estado_mantencion_id,
        fec_termino,  // Campo opcional para la fecha
    } = req.body;

    try {
        // Validación de existencia de llaves foráneas
        const [bitacoraExists] = await pool.query("SELECT 1 FROM bitacora WHERE id = ? AND isDeleted = 0", [bitacora_id]);
        if (bitacoraExists.length === 0) {
            return res.status(400).json({ message: "Bitácora no existe o está eliminada" });
        }
        
        const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquina_id]);
        if (maquinaExists.length === 0) {
            return res.status(400).json({ message: "Máquina no existe o está eliminada" });
        }

        const [tallerExists] = await pool.query("SELECT 1 FROM taller WHERE id = ? AND isDeleted = 0", [taller_id]);
        if (tallerExists.length === 0) {
            return res.status(400).json({ message: "Taller no existe o está eliminado" });
        }

        const [estadoExists] = await pool.query("SELECT 1 FROM estado_mantencion WHERE id = ?", [estado_mantencion_id]);
        if (estadoExists.length === 0) {
            return res.status(400).json({ message: "Estado de mantención no existe" });
        }

        // Validar y formatear fec_termino si está presente
        let formattedFecTermino = null;
        if (fec_termino) {
            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            if (!fechaRegex.test(fec_termino)) {
                return res.status(400).json({
                    message: 'El formato de la fecha es inválido. Debe ser dd-mm-yyyy'
                });
            }

            const dateParts = fec_termino.split('-'); // formato dd-mm-yyyy
            const [day, month, year] = dateParts.map(Number);
            formattedFecTermino = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; // formato yyyy-mm-dd
        }

        const [rows] = await pool.query(
            'INSERT INTO mantencion (bitacora_id, maquina_id, ord_trabajo, n_factura, cost_ser, taller_id, estado_mantencion_id, fec_termino, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, IFNULL(STR_TO_DATE(?, "%d-%m-%Y"), NULL), 0)',
            [
                bitacora_id,
                maquina_id,
                ord_trabajo,
                n_factura,
                cost_ser,
                taller_id,
                estado_mantencion_id,
                formattedFecTermino, // Pasar la fecha formateada o null
            ]
        );

        res.status(201).json({
            id: rows.insertId,
            bitacora_id,
            maquina_id,
            ord_trabajo,
            n_factura,
            cost_ser,
            taller_id,
            estado_mantencion_id,
            fec_termino: formattedFecTermino, // También devolver la fecha formateada
        });
    } catch (error) {
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

// Actualizar mantencion
export const updateMantencion = async (req, res) => {
    const { id } = req.params;
    const {
        bitacora_id,
        maquina_id,
        ord_trabajo,
        n_factura,
        cost_ser,
        taller_id,
        estado_mantencion_id, // Nueva columna
        isDeleted,
        fec_termino // Nueva columna
    } = req.body;

    try {
        // Validación de existencia de llaves foráneas
        const updates = {};

        // Validaciones para llaves foráneas
        if (bitacora_id !== undefined) {
            const [bitacoraExists] = await pool.query("SELECT 1 FROM bitacora WHERE id = ? AND isDeleted = 0", [bitacora_id]);
            if (bitacoraExists.length === 0) {
                return res.status(400).json({ message: "Bitácora no existe o está eliminada" });
            }
            updates.bitacora_id = bitacora_id;
        }

        if (maquina_id !== undefined) {
            const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquina_id]);
            if (maquinaExists.length === 0) {
                return res.status(400).json({ message: "Máquina no existe o está eliminada" });
            }
            updates.maquina_id = maquina_id;
        }

        if (taller_id !== undefined) {
            const [tallerExists] = await pool.query("SELECT 1 FROM taller WHERE id = ? AND isDeleted = 0", [taller_id]);
            if (tallerExists.length === 0) {
                return res.status(400).json({ message: "Taller no existe o está eliminado" });
            }
            updates.taller_id = taller_id;
        }

        if (estado_mantencion_id !== undefined) {
            const [estadoExists] = await pool.query("SELECT 1 FROM estado_mantencion WHERE id = ?", [estado_mantencion_id]);
            if (estadoExists.length === 0) {
                return res.status(400).json({ message: "Estado de mantención no existe" });
            }
            updates.estado_mantencion_id = estado_mantencion_id; // Nueva columna
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

        // Validar y agregar fec_termino
        if (fec_termino !== undefined) {
            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            if (!fechaRegex.test(fec_termino)) {
                return res.status(400).json({
                    message: 'El formato de la fecha es inválido. Debe ser dd-mm-aaaa'
                });
            }
            updates.fec_termino = 'STR_TO_DATE(?, \'%d-%m-%Y\')'; // Nueva columna
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

        const setClause = Object.keys(updates)
            .map((key) => `${key} = ${updates[key]}`)
            .join(", ");

        if (!setClause) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar"
            });
        }

        const values = Object.values(updates).map(value => value.includes('STR_TO_DATE') ? fec_termino : value).concat(id);
        const [result] = await pool.query(`UPDATE mantencion SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Mantención no encontrada"
            });
        }

        const [rows] = await pool.query("SELECT * FROM mantencion WHERE id = ?", [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};



// -----Reportes
export const getMantencionCostosByAnio = async (req, res) => {
    const { year } = req.query;

    // Validación del año
    if (!/^\d{4}$/.test(year)) {
        return res.status(400).json({ message: "El año debe ser un número de 4 dígitos" });
    }

    try {
        const [rows] = await pool.query(`
            SELECT 
                MONTH(b.fh_salida) AS mes, 
                SUM(m.cost_ser) AS costoTotal,
                COUNT(m.id) AS totalMantenciones
            FROM 
                mantencion m
            INNER JOIN 
                bitacora b ON m.bitacora_id = b.id
            WHERE 
                YEAR(b.fh_salida) = ?
            GROUP BY 
                MONTH(b.fh_salida)
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
                mes: mesData.mes,
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


// getReporteMantencionesEstadoCosto
export const getReporteMantencionesEstadoCosto = async (req, res) => {
    const { startDate, endDate, companiaId } = req.query;
  
    // Validar fechas
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Se requieren startDate y endDate en formato dd-mm-yyyy." });
    }
  
    try {
      // Comenzar a construir la consulta
      let query = `
        SELECT 
          YEAR(b.fh_llegada) AS year,          -- Obtener el año de la fecha de llegada
          MONTH(b.fh_llegada) AS month,        -- Obtener el mes de la fecha de llegada
          em.nombre AS estado_mantencion,
          COUNT(m.id) AS count,
          SUM(m.cost_ser) AS cost
        FROM mantencion m
        JOIN bitacora b ON m.bitacora_id = b.id
        JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
        WHERE m.isDeleted = 0 
          AND b.fh_llegada BETWEEN STR_TO_DATE(?, '%d-%m-%Y') AND STR_TO_DATE(?, '%d-%m-%Y')
      `;
  
      const params = [startDate, endDate];
  
      if (companiaId) {
        query += " AND b.compania_id = ?";   // Filtro por compania_id
        params.push(companiaId);
      }
  
      query += `
        GROUP BY year, month, em.nombre
        ORDER BY year, month
      `;
  
      // Ejecutar la consulta con los parámetros
      const [rows] = await pool.query(query, params);
  
      // Formatear la respuesta
      const report = {};
      rows.forEach(row => {
        // Formatear el mes con el año (por ejemplo: nov-2024)
        const monthName = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(new Date(row.year, row.month - 1));
        const monthYear = `${monthName}-${row.year}`;
        
        // Si no existe la clave para ese mes/año, crearla
        if (!report[monthYear]) {
          report[monthYear] = {};
        }

        // Agregar el estado de mantenimiento y sus valores
        report[monthYear][row.estado_mantencion] = {
          count: row.count,
          cost: row.cost
        };
      });
  
      res.json(report);
    } catch (error) {
      return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

