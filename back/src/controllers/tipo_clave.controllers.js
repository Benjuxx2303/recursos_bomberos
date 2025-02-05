import { pool } from "../db.js";

// Devuelve todos los tipos de clave
export const getTiposClave = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM tipo_clave WHERE isDeleted = 0");
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Devuelve todos los tipos de clave con paginación opcional
export const getTiposClavePage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

        if (!req.query.page) {
            const query = "SELECT * FROM tipo_clave WHERE isDeleted = 0";
            const [rows] = await pool.query(query);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT * 
            FROM tipo_clave 
            WHERE isDeleted = 0
            LIMIT ? OFFSET ?`;

        const [rows] = await pool.query(query, [pageSize, offset]);
        res.json(rows);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Devuelve tipo de clave por ID
export const getTipoClaveById = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }
        
        const [rows] = await pool.query("SELECT * FROM tipo_clave WHERE id = ? AND isDeleted = 0", [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Tipo de clave no encontrado"
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

// Crear tipo de clave
export const createTipoClave = async (req, res) => {
    let { nombre } = req.body;
    let errors = [];

    try {
        nombre = String(nombre).trim();

        // Validación de datos
        if (!nombre || typeof nombre !== "string") {
            errors.push("Tipo de datos inválido para 'nombre'");
        }

        // Validar largo de nombre
        if (nombre.length > 45) {
            errors.push('El nombre debe tener un largo máximo de 45 caracteres');
        }

        // Validar si existe tipo de clave con el mismo nombre
        const [tipoClaveExists] = await pool.query("SELECT * FROM tipo_clave WHERE nombre = ? AND isDeleted = 0", [nombre]);
        if (tipoClaveExists.length > 0) {
            errors.push('Ya existe un tipo de clave con ese nombre');
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Crear el tipo de clave
        const [rows] = await pool.query("INSERT INTO tipo_clave (nombre, isDeleted) VALUES (?, 0)", [nombre]);
        res.status(201).json({
            id: rows.insertId,
            nombre
        });

    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Dar de baja tipo de clave
export const deleteTipoClave = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query("UPDATE tipo_clave SET isDeleted = 1 WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Tipo de clave no encontrado"
            });
        }
        
        res.status(204).end();
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Actualizar tipo de clave
export const updateTipoClave = async (req, res) => {
    const { id } = req.params;
    let { nombre, isDeleted } = req.body;
    let errors = [];

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        // Validaciones
        const updates = {};

        // Validar 'nombre'
        if (nombre !== undefined) {
            nombre = String(nombre).trim();
            if (typeof nombre !== 'string' || nombre.length === 0) {
                errors.push('Tipo de dato inválido para "nombre"');
            } else if (nombre.length > 45) {
                errors.push('El nombre debe tener un largo máximo de 45 caracteres');
            } else {
                // Validar si existe tipo de clave con el mismo nombre
                const [tipoClaveExists] = await pool.query(
                    "SELECT COUNT(*) AS count FROM tipo_clave WHERE nombre = ? AND id != ?", 
                    [nombre, idNumber]
                );
                
                if (tipoClaveExists && tipoClaveExists[0] && tipoClaveExists[0].count > 0) {
                    errors.push('Ya existe un tipo de clave con ese nombre');
                }
            }

            // Solo agregar al objeto updates si no hay errores
            if (errors.length === 0) {
                updates.nombre = nombre;
            }
        }

        // Validar 'isDeleted'
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            }
            updates.isDeleted = isDeleted; // Agregar a 'updates' si no hay errores
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Construir la consulta de actualización
        const setClause = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ");

        if (!setClause) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar"
            });
        }

        const values = Object.values(updates).concat(idNumber);
        const [result] = await pool.query(`UPDATE tipo_clave SET ${setClause} WHERE id = ?`, values);

        // Verifica si no se afectaron filas (tipo de clave no encontrado)
        if (result.affectedRows === 0) {
            return res.status(404).json({
                errors: ["Tipo de clave no encontrado"]
            });
        }

        const [rows] = await pool.query("SELECT * FROM tipo_clave WHERE id = ?", [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};