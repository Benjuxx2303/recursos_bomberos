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

// paginacion
export const getEstadosMantencionPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Página por defecto es 1
        const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño por defecto es 10

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const [rows] = await pool.query(`
                SELECT id, nombre, descripcion
                FROM estado_mantencion
                WHERE isDeleted = 0
            `);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", aplicar paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion
            FROM estado_mantencion
            WHERE isDeleted = 0
            LIMIT ? OFFSET ?
        `, [pageSize, offset]);

        res.json(rows);
    } catch (error) {
        console.error('error: ', error);
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
    let { nombre, descripcion } = req.body;
    const errors = []; // Arreglo para capturar errores

    try {
        nombre = String(nombre).trim();
        descripcion = String(descripcion).trim();
        // Validar tipos de datos
        if (typeof nombre !== 'string') {
            errors.push('Tipo de dato inválido para "nombre"');
        }

        if (typeof descripcion !== 'string') {
            errors.push('Tipo de dato inválido para "descripcion"');
        }

        // Validar largo de campos
        if (nombre && nombre.length > 50) {
            errors.push('El largo del nombre no debe exceder 50 caracteres');
        }

        if (descripcion && descripcion.length > 100) {
            errors.push('El largo de la descripción no debe exceder 100 caracteres');
        }

        // Si se encontraron errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ message: 'Errores de validación', errors });
        }

        // Validar si ya existe un estado de mantención con el mismo nombre
        const [estados] = await pool.query('SELECT * FROM estado_mantencion WHERE nombre = ?', [nombre]);
        if (estados.length > 0) {
            errors.push('Ya existe un estado de mantención con el mismo nombre');
        }

        // Si se encontraron errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

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
        errors.push(error.message);
        return res.status(500).json({ message: "Error interno del servidor", errors });
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
    let { nombre, descripcion, isDeleted } = req.body;
    const errors = []; // Arreglo para capturar errores

    try {
        const updates = {};

        // validaciones "nombre"
        if (nombre !== undefined) {
            nombre = String(nombre).trim();
            // Validar tipo de dato
            if (typeof nombre !== 'string') {
                errors.push('Tipo de dato inválido para "nombre"');
            }
            // Validar largo de campo
            if (nombre.length > 50) {
                errors.push('El largo del nombre no debe exceder 50 caracteres');
            }
            // Validar si ya existe un estado de mantención con el mismo nombre
            const [estados] = await pool.query('SELECT * FROM estado_mantencion WHERE nombre = ? ', [nombre]);
            if (estados.length > 0) {
                errors.push('Ya existe un estado de mantención con el mismo nombre');
            }
            updates.nombre = nombre;
        }

        // validaciones "descripcion"
        if (descripcion !== undefined) {
            descripcion = String(descripcion).trim();
            // Validar tipo de dato
            if (typeof descripcion !== 'string') {
                errors.push('Tipo de dato inválido para "descripcion"');
            }
            // Validar largo de campo
            if (descripcion.length > 100) {
                errors.push('El largo de la descripción no debe exceder 100 caracteres');
            }
            updates.descripcion = descripcion;
        }

        // Validación de isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de datos inválido para 'isDeleted'");
            }
            updates.isDeleted = isDeleted;
        }

        // Si se encontraron errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

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
        errors.push(error.message);
        return res.status(500).json({ message: "Error interno del servidor", errors });
    }
};
