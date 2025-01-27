import { pool } from "../db.js";

// Devuelve todos los tipos de máquina
export const getTiposMaquinas = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM tipo_maquina WHERE isDeleted = 0");
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Devuelve todos los tipos de máquina con paginación opcional
export const getTiposMaquinasPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales
        const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const query = "SELECT * FROM tipo_maquina WHERE isDeleted = 0";
            const [rows] = await pool.query(query);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT * 
            FROM tipo_maquina 
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

// Devuelve tipo de máquina por ID
export const getTipoMaquinaById = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }
        
        const [rows] = await pool.query("SELECT * FROM tipo_maquina WHERE id = ? AND isDeleted = 0", [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Tipo de máquina no encontrado"
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

// Crear tipo de máquina
export const createTipoMaquina = async (req, res) => {
    let { nombre, descripcion } = req.body;
    let errors = [];

    try {
        nombre = String(nombre).trim();
        descripcion = String(descripcion).trim();

        // Validación de datos
        if (!nombre || typeof nombre !== "string") {
            errors.push("Tipo de datos inválido para 'nombre'");
          }

        if (!descripcion || typeof descripcion !== 'string') {
            errors.push("Tipo de datos inválido para 'descripcion'");
        }

        // Validar largo de nombre
        if (nombre.length > 50) {
            errors.push('La clasificación debe tener un largo máximo de 50 caracteres');
        }

        // Validar largo de descripción
        if (descripcion.length > 100) {
            errors.push('La descripción debe tener un largo máximo de 100 caracteres');
        }

        // Validar si existe tipo de máquina con la misma clasificación
        const [tipoMaquinaExists] = await pool.query("SELECT * FROM tipo_maquina WHERE nombre = ? AND isDeleted = 0", [nombre]);
        if (tipoMaquinaExists.length > 0) {
            errors.push('Ya existe un tipo de máquina con esa clasificación');
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            console.log(errors)
            return res.status(400).json({ errors });
        }

        // Crear el tipo de máquina
        const [rows] = await pool.query("INSERT INTO tipo_maquina (nombre, isDeleted) VALUES (?, 0)", [nombre]);
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


// Dar de baja tipo de máquina
export const deleteTipoMaquina = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query("UPDATE tipo_maquina SET isDeleted = 1 WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Tipo de máquina no encontrado"
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

// Actualizar tipo de máquina
export const updateTipoMaquina = async (req, res) => {
    const { id } = req.params;
    let { nombre, descripcion, isDeleted } = req.body;
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
            } else if (nombre.length > 50) {
                errors.push('La clasificación debe tener un largo máximo de 50 caracteres');
            } else {
                // Validar si existe tipo de máquina con el mismo nombre
                const [tipoMaquinaExists] = await pool.query(
                    "SELECT COUNT(*) AS count FROM tipo_maquina WHERE nombre = ? AND id != ?", 
                    [nombre, idNumber]
                );
                
                // Asegúrate de que tipoMaquinaExists tenga la propiedad 'count' de forma correcta
                if (tipoMaquinaExists && tipoMaquinaExists[0] && tipoMaquinaExists[0].count > 0) {
                    errors.push('Ya existe un tipo de máquina con esa clasificación');
                }
            }

            // Solo agregar al objeto updates si no hay errores
            if (errors.length === 0) {
                updates.nombre = nombre;
            }
        }

        // Validar 'descripcion'
        if (descripcion !== undefined) {
            descripcion = String(descripcion).trim();
            if (typeof descripcion !== 'string') {
                errors.push('Tipo de dato inválido para "descripcion"');
            }

            // Validar largo de descripción
            if (descripcion.length > 100) {
                errors.push('La descripción debe tener un largo máximo de 100 caracteres');
            }

            updates.descripcion = descripcion; // Agregar a 'updates' si no hay errores
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
        const [result] = await pool.query(`UPDATE tipo_maquina SET ${setClause} WHERE id = ?`, values);

        // Verifica si no se afectaron filas (tipo de máquina no encontrado)
        if (result.affectedRows === 0) {
            return res.status(404).json({
                errors: ["Tipo de máquina no encontrado"] // Asegúrate de devolver un campo 'errors'
            });
        }

        const [rows] = await pool.query("SELECT * FROM tipo_maquina WHERE id = ?", [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};