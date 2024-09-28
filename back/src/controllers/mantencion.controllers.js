import { pool } from "../db.js";

export const getMantenciones = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM mantencion");
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
             message: error 
        });
    }
}

export const getMantencioneswithDetails = async (req, res) => {
    try {
        const [rows] = await pool.query(`
        SELECT
            m.id, 
            m.ord_trabajo, 
            ma.patente AS 'patente',
            p.nombre AS 'personal',
            t.nombre AS 'taller'
        FROM mantencion m
        INNER JOIN maquina ma ON m.maquina_id = ma.id
        INNER JOIN personal p ON m.personal_id_responsable = p.id
        INNER JOIN taller t ON m.taller_id = t.id;
        `);

        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// mantencion by ID
export const getMantencionById = async(req, res)=> {
    try {
        const [rows] = await pool.query("SELECT * FROM mantencion WHERE id = ?", [req.params.id]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Mantencion no encontrada",
            });
        }
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error 
        });
    }
}

// TODO: Validaciones
export const createMantencion = async (req, res) => {
    const {
        bitacora_id, // fk
        maquina_id, // fk
        personal_id_responsable, // fk
        compania_id, // fk
        ord_trabajo,
        n_factura,
        cost_ser,
        taller_id, // fk
    } = req.body;

    try {
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

        res.send({
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
            message: error 
        });
    }
};

export const deleteMantencion = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM mantencion WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Mantencion no encontrada" 
            });
        }
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: error 
        });
    }
};

// TODO: Revisar
// TODO: Validaciones
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
            message: error
        });
    }
};