import { pool } from "../db.js";

export const getTipoMantenciones = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM tipo_mantencion");
    res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

//tipo_mantencion by ID
export const getTipoMantencionById = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM tipo_mantencion WHERE id = ?", [req.params.id]
        );
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Tipo de mantención no encontrada"
            });
        }
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// TODO: validaciones
export const createTipoMantencion = async (req, res) => {
    const { nombre } = req.body;
    
    try {
        const [rows] = await pool.query("INSERT INTO tipo_mantencion (nombre) VALUES (?)", [nombre]);
        res.send({
            id: rows.insertId,
            nombre,
        });
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// TODO: "flag" para ocultar registros?
export const deleteTipoMantencion = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM tipo_mantencion WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Tipo de mantención no encontrada"
            });
        }
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// TODO: Validaciones
export const updateTipoMantencion = async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;

    try {
        const [result] = await pool.query("UPDATE tipo_mantencion SET nombre = IFNULL(?, nombre) WHERE id = ?", [nombre, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Tipo de mantención no encontrada"
            });
        }

        const [rows] = await pool.query("SELECT * FROM tipo_mantencion WHERE id = ?",[id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};