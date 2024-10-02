import { pool } from "../db.js";

// Obtener todas las procedencias
export const getProcedencias = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM procedencia WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

// Obtener procedencia por ID
export const getProcedenciaById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM procedencia WHERE id = ? AND isDeleted = 0', [id]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Procedencia no encontrada"
            });
        }
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

// Crear una nueva procedencia
export const createProcedencia = async (req, res) => {
    const { nombre } = req.body;

    try {
        if (typeof nombre !== 'string' || nombre.trim() === '') {
            return res.status(400).json({
                message: 'Nombre es un campo obligatorio y debe ser una cadena válida'
            });
        }

        const [rows] = await pool.query("INSERT INTO procedencia(nombre, isDeleted) VALUES(?, 0)", [nombre]);
        res.status(201).json({
            id: rows.insertId,
            nombre
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

// Cambiar estado a 'eliminado'
export const deleteProcedencia = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("UPDATE procedencia SET isDeleted = 1 WHERE id = ?", [id]);
        if (result.affectedRows <= 0) {
            return res.status(404).json({
                message: "Procedencia no encontrada"
            });
        }
        res.status(204).end();
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

// Actualizar procedencia
export const updateProcedencia = async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;

    try {
        if (typeof nombre !== 'string' || nombre.trim() === '') {
            return res.status(400).json({
                message: 'Nombre es un campo obligatorio y debe ser una cadena válida'
            });
        }

        const [result] = await pool.query('UPDATE procedencia SET nombre = IFNULL(?, nombre) WHERE id = ?', [nombre, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Procedencia no encontrada"
            });
        }

        const [rows] = await pool.query("SELECT * FROM procedencia WHERE id = ?", [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}
