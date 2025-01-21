import { pool } from "../db.js";

// Obtener todas las mantenciones activas
export const getTipoMantenciones = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM tipo_mantencion WHERE isDeleted = 0");
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Obtener todos los tipos de mantenciones activas con paginación
export const getTipoMantencionesPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales de la consulta
        const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const [rows] = await pool.query("SELECT * FROM tipo_mantencion WHERE isDeleted = 0");
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT * 
            FROM tipo_mantencion
            WHERE isDeleted = 0
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.query(query, [pageSize, offset]);
        res.json(rows);
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Obtener tipo de mantención por ID (solo activos)
export const getTipoMantencionById = async (req, res) => {
    const { id } = req.params;

    // Validación de datos
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
        return res.status(400).json({
            message: "Tipo de datos inválido",
        });
    }

    try {
        const [rows] = await pool.query("SELECT * FROM tipo_mantencion WHERE id = ? AND isDeleted = 0", [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Tipo de mantención no encontrada"
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

export const createTipoMantencion = async (req, res) => {
    const { nombre } = req.body;
    let errors = [];

    // Validación de datos
    if (typeof nombre !== "string" || nombre.trim() === "") {
        errors.push("Tipo de datos inválido para 'nombre'");
    }

    // Validar largo de campos
    if (nombre.length > 50) {
        errors.push("Nombre de tipo de mantención muy largo");
    }

    // Validar si ya existe el tipo de mantención con el mismo nombre
    const [tipoMantencionExists] = await pool.query("SELECT * FROM tipo_mantencion WHERE nombre = ?", [nombre]);
    if (tipoMantencionExists.length > 0) {
        errors.push("Ya existe un tipo de mantención con ese nombre");
    }

    // Si hay errores, devolverlos
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        // Se crea activo (isDeleted = 0) por defecto
        const [rows] = await pool.query("INSERT INTO tipo_mantencion (nombre, isDeleted) VALUES (?, 0)", [nombre]);
        console.log('rows: ', rows);
        res.status(201).send({
            id: rows.insertId,
            nombre,
        });
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};


// Eliminar tipo de mantención (marcar como eliminado)
export const deleteTipoMantencion = async (req, res) => {
    const { id } = req.params;

    // Validación de datos
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
        return res.status(400).json({
            message: "Tipo de datos inválido"
        });
    }

    try {
        const [result] = await pool.query("UPDATE tipo_mantencion SET isDeleted = 1 WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Tipo de mantención no encontrada"
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

// Actualizar tipo de mantención
export const updateTipoMantencion = async (req, res) => {
    const { id } = req.params;
    let { nombre, isDeleted } = req.body;  // Cambiado a let para permitir modificación
    let errors = [];

    try {
        // Validación de ID
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        const updates = {};

        if (nombre !== undefined) {
            nombre = String(nombre).trim();

            if (nombre === "") {
                errors.push("El nombre no puede estar vacío");
            }

            if (nombre.length > 50) {
                errors.push("Nombre de tipo de mantención muy largo");
            }

            // Verificar existencia del registro antes de la actualización
            const [existingRows] = await pool.query('SELECT * FROM tipo_mantencion WHERE id = ?', [idNumber]);
            if (existingRows.length === 0) {
                return res.status(404).json({ message: "Tipo de mantención no encontrada" });
            }

            // Validar nombre duplicado
            const [duplicateRows] = await pool.query(
                'SELECT COUNT(*) AS count FROM tipo_mantencion WHERE nombre = ? AND id != ?', 
                [nombre, idNumber]
            );
            
            if (duplicateRows[0].count > 0) {
                errors.push("Ya existe un tipo de mantención con ese nombre");
            }

            updates.nombre = nombre;
        }

        // Validar y agregar isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            }
            updates.isDeleted = isDeleted;
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Verificar si hay campos a actualizar
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        }

        const setClause = Object.keys(updates)
            .map(key => `${key} = ?`)
            .join(", ");
        
        const values = Object.values(updates).concat(id);

        // Actualizar tipo de mantención en la base de datos
        const [result] = await pool.query(`UPDATE tipo_mantencion SET ${setClause} WHERE id = ?`, values);
        console.log("Resultado de la actualización:", result);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Tipo de mantención no encontrado" });
        }
        
        

        // Obtener el registro actualizado
        const [rows] = await pool.query('SELECT * FROM tipo_mantencion WHERE id = ?', [idNumber]);
        if (rows.length === 0) {
            return res.status(404).json({
                message: 'tipo_mantencion no encontrado'
            });
        }
    console.log('Fila encontrada:', rows[0]);
    res.json(rows[0]);
    } catch (error) {
        console.error('Error interno del servidor:', error); // Mostrar el error completo
        console.error(error.stack); 
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error // Devuelve el error completo para ver más detalles
        });
    }
};