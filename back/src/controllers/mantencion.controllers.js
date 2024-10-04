import { pool } from "../db.js";

// Obtener todas las mantenciones
// export const getMantenciones = async (req, res) => {
//     try {
//         const query = `
//             SELECT m.*, b.fecha 
//             FROM mantencion m
//             JOIN bitacora b ON m.bitacora_id = b.id
//             WHERE m.isDeleted = 0
//         `;
//         const [rows] = await pool.query(query);
//         res.json(rows);
//     } catch (error) {
//         return res.status(500).json({
//             message: error.message 
//         });
//     }
// };

// Obtener mantenciones con detalles
export const getMantencionesWithDetails = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                m.id, 
                m.bitacora_id, 
                ma.patente AS 'patente',
                p.rut AS 'personal_responsable',
                m.compania_id, 
                m.ord_trabajo, 
                t.nombre AS 'taller'
            FROM mantencion m
            INNER JOIN maquina ma ON m.maquina_id = ma.id
            INNER JOIN personal p ON m.personal_id_responsable = p.id
            INNER JOIN taller t ON m.taller_id = t.id
            WHERE m.isDeleted = 0
        `);

        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// Obtener mantencion por ID
export const getMantencionById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query(`
            SELECT
                m.id, 
                m.bitacora_id, 
                ma.patente AS 'patente',
                p.rut AS 'personal_responsable',
                m.compania_id, 
                m.ord_trabajo, 
                t.nombre AS 'taller'
            FROM mantencion m
            INNER JOIN maquina ma ON m.maquina_id = ma.id
            INNER JOIN personal p ON m.personal_id_responsable = p.id
            INNER JOIN taller t ON m.taller_id = t.id
            WHERE m.id = ? AND m.isDeleted = 0
            `, [id]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Mantencion no encontrada",
            });
        }
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error.message 
        });
    }
};

// Crear mantencion
export const createMantencion = async (req, res) => {
    const {
        bitacora_id,
        maquina_id,
        personal_id_responsable,
        compania_id,
        ord_trabajo,
        n_factura,
        cost_ser,
        taller_id,
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
        
        const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personal_id_responsable]);
        if (personalExists.length === 0) {
            return res.status(400).json({ message: "Personal no existe o está eliminado" });
        }
        
        const [tallerExists] = await pool.query("SELECT 1 FROM taller WHERE id = ? AND isDeleted = 0", [taller_id]);
        if (tallerExists.length === 0) {
            return res.status(400).json({ message: "Taller no existe o está eliminado" });
        }
        

        const [rows] = await pool.query(
            "INSERT INTO mantencion (bitacora_id, maquina_id, personal_id_responsable, compania_id, ord_trabajo, n_factura, cost_ser, taller_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                bitacora_id,
                maquina_id,
                personal_id_responsable,
                compania_id,
                ord_trabajo,
                n_factura,
                cost_ser,
                taller_id,
            ]
        );

        res.status(201).json({
            id: rows.insertId,
            bitacora_id,
            maquina_id,
            personal_id_responsable,
            compania_id,
            ord_trabajo,
            n_factura,
            cost_ser,
            taller_id,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message 
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
        personal_id_responsable,
        compania_id,
        ord_trabajo,
        n_factura,
        cost_ser,
        taller_id,
    } = req.body;

    try {
        // Validación de existencia de llaves foráneas
        const [bitacoraExists] = await pool.query("SELECT 1 FROM bitacora WHERE id = ? AND isDeleted = 0", [bitacora_id]);
        const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquina_id]);
        const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personal_id_responsable]);
        const [tallerExists] = await pool.query("SELECT 1 FROM taller WHERE id = ? AND isDeleted = 0", [taller_id]);

        if (!bitacoraExists.length || !maquinaExists.length || !personalExists.length || !tallerExists.length) {
            return res.status(400).json({
                message: 'Una o más llaves foráneas no existen'
            });
        }

        const [result] = await pool.query(
            "UPDATE mantencion SET " +
            "bitacora_id = IFNULL(?, bitacora_id), " +
            "maquina_id = IFNULL(?, maquina_id), " +
            "personal_id_responsable = IFNULL(?, personal_id_responsable), " +
            "compania_id = IFNULL(?, compania_id), " +
            "ord_trabajo = IFNULL(?, ord_trabajo), " +
            "n_factura = IFNULL(?, n_factura), " +
            "cost_ser = IFNULL(?, cost_ser), " +
            "taller_id = IFNULL(?, taller_id) " +
            "WHERE id = ?", [
                bitacora_id,
                maquina_id,
                personal_id_responsable,
                compania_id,
                ord_trabajo,
                n_factura,
                cost_ser,
                taller_id,
                id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Mantencion no encontrada"
            });
        }

        const [rows] = await pool.query("SELECT * FROM mantencion WHERE id = ?", [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// Obtener costos de mantenciones por mes
export const getMantencionCostosByMes = async (req, res) => {
    const { anio } = req.params;

    try {
        const [rows] = await pool.query(`
            SELECT 
                MONTH(b.fecha) AS mes, 
                SUM(m.cost_ser) AS costoTotal
            FROM 
                mantencion m
            INNER JOIN 
                bitacora b ON m.bitacora_id = b.id
            WHERE 
                YEAR(b.fecha) = ?
                AND m.isDeleted = 0
            GROUP BY 
                MONTH(b.fecha)
            ORDER BY 
                mes
        `, [anio]);

        const result = {
            anio: parseInt(anio),
            meses: []
        };

        for (let i = 1; i <= 12; i++) {
            const mesData = rows.find(row => row.mes === i) || { mes: i, costoTotal: 0 };
            result.meses.push({
                mes: mesData.mes,
                costoTotal: mesData.costoTotal
            });
        }

        res.json(result);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};