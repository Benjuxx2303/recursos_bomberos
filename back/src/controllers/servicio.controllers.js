import { pool } from "../db.js";

// Obtener todos los servicios (activos) con información de subdivision
export const getServicios = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, sub.nombre AS subdivision
            FROM servicio s
            INNER JOIN subdivision sub ON s.subdivision_id = sub.id
            WHERE s.isDeleted = 0
        `);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// Obtener un servicio por ID (solo activos) con información de subdivision
export const getServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [rows] = await pool.query(`
            SELECT s.*, sub.nombre AS subdivision
            FROM servicio s
            INNER JOIN subdivision sub ON s.subdivision_id = sub.id
            WHERE s.id = ? AND s.isDeleted = 0
        `, [idNumber]);

        if (rows.length <= 0) {
            return res.status(404).json({
                message: 'Servicio no encontrado'
            });
        }
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// Crear un nuevo servicio
export const createServicio = async (req, res) => {
    const { subdivision_id, descripcion } = req.body;

    try {
        // Validar existencia de la subdivision
        const [subdivisionExists] = await pool.query("SELECT 1 FROM subdivision WHERE id = ? AND isDeleted = 0", [subdivision_id]);
        if (subdivisionExists.length === 0) {
            return res.status(400).json({
                message: "Subdivision no existe o está eliminada"
            });
        }

        if (typeof descripcion !== "string") {
            return res.status(400).json({
                message: "Tipo de datos inválido para 'descripcion'"
            });
        }

        const [rows] = await pool.query('INSERT INTO servicio (subdivision_id, descripcion, isDeleted) VALUES (?, ?, 0)', [subdivision_id, descripcion]);
        res.status(201).json({
            id: rows.insertId,
            subdivision_id,
            descripcion
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// Eliminar un servicio (marcar como eliminado)
export const deleteServicio = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query('UPDATE servicio SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) {
            return res.status(404).json({
                message: 'Servicio no encontrado'
            });
        }
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// Actualizar un servicio
export const updateServicio = async (req, res) => {
    const { id } = req.params;
    const { subdivision_id, descripcion, isDeleted } = req.body;

    try {
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido para 'id'"
            });
        }

        const updates = {};

        // Validar y agregar subdivision_id
        if (subdivision_id !== undefined) {
            const [subdivisionExists] = await pool.query("SELECT 1 FROM subdivision WHERE id = ? AND isDeleted = 0", [subdivision_id]);
            if (subdivisionExists.length === 0) {
                return res.status(400).json({
                    message: "Subdivision no existe o está eliminada"
                });
            }
            updates.subdivision_id = subdivision_id;
        }

        // Validar y agregar descripcion
        if (descripcion !== undefined) {
            if (typeof descripcion !== "string") {
                return res.status(400).json({
                    message: "Tipo de datos inválido para 'descripcion'"
                });
            }
            updates.descripcion = descripcion;
        }

        // Validar y agregar isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                return res.status(400).json({
                    message: "Tipo de datos inválido para 'isDeleted'"
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

        const values = Object.values(updates).concat(idNumber);
        const [result] = await pool.query(`UPDATE servicio SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Servicio no encontrado'
            });
        }

        const [rows] = await pool.query('SELECT * FROM servicio WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
