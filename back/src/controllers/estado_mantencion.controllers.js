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
    const { nombre, descripcion } = req.body;

    // Arreglo para almacenar los errores de validación
    const errors = [];

    try {
        // Validación de longitud de campos
        if (nombre.length > 45) {
            errors.push("El nombre no puede tener más de 45 caracteres");
        }

        if (descripcion.length > 100) {
            errors.push("La descripción no puede tener más de 100 caracteres");
        }

        // Validar si ya existe el estado de mantención con el mismo nombre
        const [estadoMantencionExists] = await pool.query('SELECT * FROM estado_mantencion WHERE nombre = ?', [nombre]);
        if (estadoMantencionExists.length > 0) {
            errors.push("Ya existe un estado de mantención con el mismo nombre");
        }

        // Si existen errores, devolverlos en la respuesta
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Insertar estado de mantención
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

    // Arreglo para acumular errores de validación
    const errors = [];

    try {
        // Validar tipo de dato para "id"
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        const updates = {};

        // Validar "nombre" si se proporciona
        if (nombre !== undefined) {
            // Validar campos vacíos
            if (nombre === null || nombre === "") {
                errors.push("El campo 'nombre' no puede estar vacío");
            }

            // Validar longitud de nombre
            if (nombre.length > 45) {
                errors.push("El nombre no puede tener más de 45 caracteres");
            }

            // Validar si ya existe un estado de mantención con el mismo nombre
            const [estadoMantencionExists] = await pool.query('SELECT * FROM estado_mantencion WHERE nombre = ?', [nombre]);
            if (estadoMantencionExists.length > 0) {
                errors.push("Ya existe un estado de mantención con el mismo nombre");
            }

            updates.nombre = nombre;
        }

        // Validar "descripcion" si se proporciona
        if (descripcion !== undefined) {
            // Validar campos vacíos
            if (descripcion === null || descripcion === "") {
                errors.push("El campo 'descripcion' no puede estar vacío");
            }

            // Validar longitud de descripción
            if (descripcion.length > 100) {
                errors.push("La descripción no puede tener más de 100 caracteres");
            }

            updates.descripcion = descripcion;
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Construir la cláusula SET para la consulta de actualización
        const setClause = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ");

        if (!setClause) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar"
            });
        }

        const values = Object.values(updates).concat(idNumber);

        // Realizar la actualización en la base de datos
        const [result] = await pool.query(`UPDATE estado_mantencion SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Estado de mantención no encontrado"
            });
        }

        // Obtener el estado de mantención actualizado
        const [rows] = await pool.query("SELECT * FROM estado_mantencion WHERE id = ?", [idNumber]);
        res.json(rows[0]);

    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};
