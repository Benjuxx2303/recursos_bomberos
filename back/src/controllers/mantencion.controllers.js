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
                m.n_factura, 
                m.cost_ser, 
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
                m.n_factura, 
                m.cost_ser, 
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
        isDeleted
    } = req.body;

    try {
        // Validación de existencia de llaves foráneas
        const updates = {};

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

        if (personal_id_responsable !== undefined) {
            const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personal_id_responsable]);
            if (personalExists.length === 0) {
                return res.status(400).json({ message: "Personal no existe o está eliminado" });
            }
            updates.personal_id_responsable = personal_id_responsable;
        }

        if (compania_id !== undefined) {
            const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [compania_id]);
            if (companiaExists.length === 0) {
                return res.status(400).json({ message: "Compañía no existe o está eliminada" });
            }
            updates.compania_id = compania_id;
        }

        if (taller_id !== undefined) {
            const [tallerExists] = await pool.query("SELECT 1 FROM taller WHERE id = ? AND isDeleted = 0", [taller_id]);
            if (tallerExists.length === 0) {
                return res.status(400).json({ message: "Taller no existe o está eliminado" });
            }
            updates.taller_id = taller_id;
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
            .map((key) => `${key} = ?`)
            .join(", ");

        if (!setClause) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar"
            });
        }

        const values = Object.values(updates).concat(id);
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