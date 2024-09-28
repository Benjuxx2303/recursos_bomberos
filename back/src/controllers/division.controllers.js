import { pool } from "../db.js";

// Obtener todas las divisiones (solo activas)
export const getDivisiones = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM division WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// Obtener una división por ID (solo activas)
export const getDivision = async (req, res) => {
    try {
        const { id } = req.params;

        // Validación de datos
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido",
            });
        }

        const [rows] = await pool.query('SELECT * FROM division WHERE id = ? AND isDeleted = 0', [idNumber]);
        if (rows.length <= 0) return res.status(404).json({
            message: 'División no encontrada'
        });
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// Crear una nueva división
export const createDivision = async (req, res) => {
    const { nombre } = req.body; // solo el nombre, ya que no hay desc en la tabla
    try {
        // Validación de datos
        if (typeof nombre !== "string") {
            return res.status(400).json({
                message: "Tipo de datos inválido",
            });
        }

        // Se crea activo (isDeleted = 0) por defecto
        const [rows] = await pool.query('INSERT INTO division (nombre, isDeleted) VALUES (?, 0)', [nombre]);
        res.send({
            id: rows.insertId,
            nombre
        });
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// Eliminar una división (marcar como eliminada)
export const deleteDivision = async (req, res) => {
    const { id } = req.params;
    try {
        // Validación de datos
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query('UPDATE division SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) return res.status(404).json({
            message: 'División no encontrada'
        });
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// Actualizar una división
export const updateDivision = async (req, res) => {
    const { id } = req.params;
    const { nombre, isDeleted } = req.body;

    try {
        // Validación de datos
        const idNumber = parseInt(id);

        if (
            isNaN(idNumber) ||
            typeof nombre !== "string" ||
            (isDeleted !== undefined && (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)))
        ) {
            return res.status(400).json({
                message: "Tipo de datos inválido",
            });
        }

        const [result] = await pool.query('UPDATE division SET nombre = IFNULL(?, nombre), isDeleted = IFNULL(?, isDeleted) WHERE id = ?', [nombre, isDeleted, idNumber]);

        if (result.affectedRows === 0) return res.status(404).json({
            message: 'División no encontrada'
        });

        const [rows] = await pool.query('SELECT * FROM division WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
}
