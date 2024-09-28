import { pool } from "../db.js";

// Obtener todos los servicios (activos) con información de subdivision
export const getServicios = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, sub.nombre AS subdivision_nombre
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
            SELECT s.*, sub.nombre AS subdivision_nombre
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
        if (typeof descripcion !== "string" || isNaN(subdivision_id)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [rows] = await pool.query('INSERT INTO servicio (subdivision_id, descripcion, isDeleted) VALUES (?, ?, 0)', [subdivision_id, descripcion]);
        res.send({
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

        if (isNaN(idNumber) || typeof descripcion !== "string" || typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query(`
            UPDATE servicio
            SET subdivision_id = IFNULL(?, subdivision_id),
                descripcion = IFNULL(?, descripcion),
                isDeleted = IFNULL(?, isDeleted)
            WHERE id = ?
        `, [subdivision_id, descripcion, isDeleted, idNumber]);

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
