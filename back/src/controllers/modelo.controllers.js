import { pool } from "../db.js";

// Devuelve todos los modelos
export const getModelos = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM modelo");
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Devuelve todos los modelos con paginación opcional
export const getModelosPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        if (!req.query.page) {
            const query = "SELECT * FROM modelo";
            const [rows] = await pool.query(query);
            return res.json(rows);
        }

        const offset = (page - 1) * pageSize;
        const query = `
            SELECT * 
            FROM modelo 
            LIMIT ? OFFSET ?`;

        const [rows] = await pool.query(query, [pageSize, offset]);
        res.json(rows);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Devuelve modelo por ID
export const getModeloById = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "ID inválido"
            });
        }
        
        const [rows] = await pool.query("SELECT * FROM modelo WHERE id = ?", [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Modelo no encontrado"
            });
        }
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Crear modelo
export const createModelo = async (req, res) => {
    const { nombre } = req.body;

    try {
        if (typeof nombre !== 'string') {
            return res.status(400).json({
                message: 'Tipo de datos inválido para nombre'
            });
        }

        const [rows] = await pool.query("INSERT INTO modelo (nombre) VALUES (?)", [nombre]);
        res.status(201).json({
            id: rows.insertId,
            nombre
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Eliminar modelo
export const deleteModelo = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "ID inválido"
            });
        }

        const [result] = await pool.query("DELETE FROM modelo WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Modelo no encontrado"
            });
        }
        
        res.status(204).end();
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Actualizar modelo
export const updateModelo = async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "ID inválido"
            });
        }

        if (typeof nombre !== 'string') {
            return res.status(400).json({
                message: 'Tipo de dato inválido para "nombre"'
            });
        }

        const [result] = await pool.query(
            "UPDATE modelo SET nombre = ? WHERE id = ?", 
            [nombre, idNumber]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Modelo no encontrado"
            });
        }

        const [rows] = await pool.query("SELECT * FROM modelo WHERE id = ?", [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};