import { pool } from "../db.js";

// Obtener todas las subdivisiones (solo activas) con detalles de la división
export const getSubdivisiones = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, d.nombre AS division
            FROM subdivision s
            INNER JOIN division d ON s.division_id = d.id
            WHERE s.isDeleted = 0 AND d.isDeleted = 0
        `);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

export const getSubdivisionesPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales de la consulta
        const page = parseInt(req.query.page) || 1; // Página por defecto es 1
        const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de página por defecto es 10

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const query = `
                SELECT s.*, d.nombre AS division
                FROM subdivision s
                INNER JOIN division d ON s.division_id = d.id
                WHERE s.isDeleted = 0 AND d.isDeleted = 0
            `;
            const [rows] = await pool.query(query);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset para la paginación

        const query = `
            SELECT s.*, d.nombre AS division
            FROM subdivision s
            INNER JOIN division d ON s.division_id = d.id
            WHERE s.isDeleted = 0 AND d.isDeleted = 0
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.query(query, [pageSize, offset]);
        res.json(rows); // Devuelve los registros con la paginación aplicada
    } catch (error) {
        console.error('Error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Obtener una subdivisión por ID (solo activas) con detalles de la división
export const getSubdivision = async (req, res) => {
    const { id } = req.params;
    const idNumber = parseInt(id);

    if (isNaN(idNumber)) {
        return res.status(400).json({
            message: "Tipo de datos inválido",
        });
    }

    try {
        const [rows] = await pool.query(`
            SELECT s.*, d.nombre AS division
            FROM subdivision s
            INNER JOIN division d ON s.division_id = d.id
            WHERE s.id = ? AND s.isDeleted = 0 AND d.isDeleted = 0
        `, [idNumber]);

        if (rows.length <= 0) return res.status(404).json({
            message: 'Subdivisión no encontrada'
        });
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
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

        // Validación de existencia de la división
        const [divisionExists] = await pool.query("SELECT 1 FROM division WHERE id = ? AND isDeleted = 0", [division_id]);
        if (divisionExists.length === 0) {
            return res.status(400).json({ message: "División no existe o está eliminada" });
        }

        // Se crea activo (isDeleted = 0) por defecto
        const [rows] = await pool.query('INSERT INTO subdivision (division_id, nombre, isDeleted) VALUES (?, ?, 0)', [division_id, nombre]);
        res.status(201).json({
            id: rows.insertId,
            division_id,
            nombre
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Eliminar una subdivisión (marcar como eliminada)
export const deleteSubdivision = async (req, res) => {
    const { id } = req.params;
    const idNumber = parseInt(id);

    if (isNaN(idNumber)) {
        return res.status(400).json({
            message: "Tipo de datos inválido"
        });
    }

    try {
        const [result] = await pool.query('UPDATE subdivision SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) return res.status(404).json({
            message: 'Subdivisión no encontrada'
        });
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Actualizar una subdivisión
export const updateSubdivision = async (req, res) => {
    const { id } = req.params;
    const { division_id, nombre, isDeleted } = req.body;
    const idNumber = parseInt(id);

    if (isNaN(idNumber)) {
        return res.status(400).json({
            message: "Tipo de datos inválido",
        });
    }

    try {
        const updates = {};

        // Validación de existencia de la división
        if (division_id !== undefined) {
            const [divisionExists] = await pool.query("SELECT 1 FROM division WHERE id = ? AND isDeleted = 0", [division_id]);
            if (divisionExists.length === 0) {
                return res.status(400).json({ message: "División no existe o está eliminada" });
            }
            updates.division_id = division_id;
        }

        if (nombre !== undefined) {
            if (typeof nombre !== "string") {
                return res.status(400).json({ message: "Tipo de dato inválido para 'nombre'" });
            }
            updates.nombre = nombre;
        }

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

        const values = Object.values(updates).concat(idNumber);
        const [result] = await pool.query(`UPDATE subdivision SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) return res.status(404).json({
            message: 'Subdivisión no encontrada'
        });

        const [rows] = await pool.query('SELECT * FROM subdivision WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};
