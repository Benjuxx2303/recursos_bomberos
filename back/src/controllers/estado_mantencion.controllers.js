import { pool } from "../db.js";

// Obtener estados de mantención
export const getEstadosMantencion = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion 
            FROM estado_mantencion 
            WHERE isDeleted = 0
        `);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Obtener estado de mantención por ID
export const getEstadoMantencionById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion 
            FROM estado_mantencion 
            WHERE id = ? AND isDeleted = 0
        `, [id]);

        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Estado de mantención no encontrado",
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

// Crear estado de mantención
export const createEstadoMantencion = async (req, res) => {
    const { nombre, descripcion } = req.body;

    try {
        const [rows] = await pool.query(`
            INSERT INTO estado_mantencion (nombre, descripcion, isDeleted) 
            VALUES (?, ?, 0)
        `, [nombre, descripcion]);

        res.status(201).json({
            id: rows.insertId,
            nombre,
            descripcion
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Eliminar estado de mantención (cambiar estado)
export const deleteEstadoMantencion = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("UPDATE estado_mantencion SET isDeleted = 1 WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Estado de mantención no encontrado"
            });
        }
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Actualizar estado de mantención
export const updateEstadoMantencion = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    try {
        const updates = {};
        if (nombre !== undefined) updates.nombre = nombre;
        if (descripcion !== undefined) updates.descripcion = descripcion;

        const setClause = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ");

        if (!setClause) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar"
            });
        }

        const values = Object.values(updates).concat(id);
        const [result] = await pool.query(`UPDATE estado_mantencion SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Estado de mantención no encontrado"
            });
        }

        const [rows] = await pool.query("SELECT * FROM estado_mantencion WHERE id = ?", [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};
