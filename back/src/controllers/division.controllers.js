import { pool } from "../db.js";

// Obtener todas las divisiones (solo activas)
export const getDivisiones = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM division WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// paginacion 
export const getDivisionesPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales
        const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const [rows] = await pool.query('SELECT * FROM division WHERE isDeleted = 0');
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT * FROM division
            WHERE isDeleted = 0
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(query, [pageSize, offset]);
        res.json(rows);
    } catch (error) {
        console.error('Error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Obtener una división por ID (solo activas)
export const getDivision = async (req, res) => {
    try {
        const { id } = req.params;
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [rows] = await pool.query('SELECT * FROM division WHERE id = ? AND isDeleted = 0', [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: 'División no encontrada'
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

// Crear una nueva división
export const createDivision = async (req, res) => {
    const { nombre } = req.body;

    // Arreglo para almacenar los errores
    const errors = [];

    try {
        // Validación de tipo de dato para 'nombre'
        if (typeof nombre !== "string") {
            errors.push("El campo 'nombre' debe ser una cadena de texto.");
        }

        // Validación de longitud de 'nombre'
        if (nombre.length > 50) {
            errors.push("La longitud del campo 'nombre' no puede ser mayor a 50 caracteres.");
        }

        // Validación de existencia de división con el mismo nombre
        const [divisionExists] = await pool.query('SELECT * FROM division WHERE nombre = ?', [nombre]);
        if (divisionExists.length > 0) {
            errors.push("Ya existe una división con el mismo nombre.");
        }

        // Si existen errores, devolverlos en la respuesta
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Crear la división (isDeleted = 0 por defecto)
        const [rows] = await pool.query('INSERT INTO division (nombre, isDeleted) VALUES (?, 0)', [nombre]);
        
        // Responder con los datos de la nueva división
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

// Eliminar una división (marcar como eliminada)
export const deleteDivision = async (req, res) => {
    const { id } = req.params;
    const idNumber = parseInt(id);

    try {
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query('UPDATE division SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) {
            return res.status(404).json({
                message: 'División no encontrada'
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

// Actualizar una división
export const updateDivision = async (req, res) => {
    const { id } = req.params;
    const { nombre, isDeleted } = req.body;
    const idNumber = parseInt(id);

    // Arreglo para almacenar los errores de validación
    const errors = [];

    try {
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        const updates = {};
        
        // Validación de nombre
        if (nombre !== undefined) {
            if (typeof nombre !== "string") {
                errors.push("El campo 'nombre' debe ser una cadena de texto.");
            }

            // Validación de longitud de nombre
            if (nombre.length > 50) {
                errors.push("La longitud del campo 'nombre' no puede ser mayor a 50 caracteres.");
            }

            // Validación de nombre único
            const [divisionExists] = await pool.query('SELECT * FROM division WHERE nombre = ? AND id != ?', [nombre, idNumber]);
            if (divisionExists.length > 0) {
                errors.push("Ya existe una división con el mismo nombre.");
            }

            // Si pasa todas las validaciones, se agrega al objeto de actualizaciones
            if (errors.length === 0) {
                updates.nombre = nombre;
            }
        }

        // Validación de isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("El campo 'isDeleted' debe ser 0 o 1.");
            } else {
                updates.isDeleted = isDeleted;
            }
        }

        // Si existen errores, devolverlos en la respuesta
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Construir la consulta de actualización
        const setClause = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ");

        if (!setClause) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar",
            });
        }

        const values = Object.values(updates).concat(idNumber);
        const [result] = await pool.query(`UPDATE division SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'División no encontrada',
            });
        }

        const [rows] = await pool.query('SELECT * FROM division WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message,
        });
    }
};
