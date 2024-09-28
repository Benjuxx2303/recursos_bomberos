import { pool } from "../db.js";

// Obtener todas las subdivisiones (solo activas)
export const getSubdivisiones = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM subdivision WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// Obtener una subdivisión por ID (solo activas)
export const getSubdivision = async (req, res) => {
    try {
        const { id } = req.params;

        // Validación de datos
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido",
            });
        }

        const [rows] = await pool.query('SELECT * FROM subdivision WHERE id = ? AND isDeleted = 0', [idNumber]);
        if (rows.length <= 0) return res.status(404).json({
            message: 'Subdivisión no encontrada'
        });
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// Crear una nueva subdivisión
export const createSubdivision = async (req, res) => {
    const { division_id, nombre } = req.body;
    try {
        // Validación de datos
        if (typeof nombre !== "string" || typeof division_id !== "number") {
            return res.status(400).json({
                message: "Tipo de datos inválido",
            });
        }

        // Se crea activo (isDeleted = 0) por defecto
        const [rows] = await pool.query('INSERT INTO subdivision (division_id, nombre, isDeleted) VALUES (?, ?, 0)', [division_id, nombre]);
        res.send({
            id: rows.insertId,
            division_id,
            nombre
        });
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// Eliminar una subdivisión (marcar como eliminada)
export const deleteSubdivision = async (req, res) => {
    const { id } = req.params;
    try {
        // Validación de datos
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query('UPDATE subdivision SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) return res.status(404).json({
            message: 'Subdivisión no encontrada'
        });
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// Actualizar una subdivisión
export const updateSubdivision = async (req, res) => {
    const { id } = req.params;
    const { division_id, nombre, isDeleted } = req.body;

    try {
        // Validación de datos
        const idNumber = parseInt(id);

        if (
            isNaN(idNumber) ||
            typeof nombre !== "string" ||
            (isDeleted !== undefined && (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1))) ||
            (division_id !== undefined && typeof division_id !== "number")
        ) {
            return res.status(400).json({
                message: "Tipo de datos inválido",
            });
        }

        const [result] = await pool.query('UPDATE subdivision SET division_id = IFNULL(?, division_id), nombre = IFNULL(?, nombre), isDeleted = IFNULL(?, isDeleted) WHERE id = ?', [division_id, nombre, isDeleted, idNumber]);

        if (result.affectedRows === 0) return res.status(404).json({
            message: 'Subdivisión no encontrada'
        });

        const [rows] = await pool.query('SELECT * FROM subdivision WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};
