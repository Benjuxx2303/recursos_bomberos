import { pool } from "../db.js";

// Obtener todas las claves
export const getClaves = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clave WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message,
        });
    }
};

export const getClavesPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales para paginación
        const page = parseInt(req.query.page) || 1; // Página actual, por defecto es la primera
        const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de página, por defecto son 10 registros

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const [rows] = await pool.query('SELECT * FROM clave WHERE isDeleted = 0');
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        // Consulta paginada
        const query = `
            SELECT * 
            FROM clave 
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

// Obtener clave por ID
export const getClaveById = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }
        
        const [rows] = await pool.query('SELECT * FROM clave WHERE id = ? AND isDeleted = 0', [idNumber]);
        if (rows.length <= 0) return res.status(404).json({ message: "Clave no encontrada" });
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Crear nueva clave
export const createClave = async (req, res) => {
    const { codigo, descripcion } = req.body;

    try {
        const errors = [];  // Arreglo para almacenar los errores

        // Validaciones de tipos de datos
        if (typeof codigo !== 'string') {
            errors.push('El campo "codigo" debe ser de tipo cadena');
        }
        if (typeof descripcion !== 'string') {
            errors.push('El campo "descripcion" debe ser de tipo cadena');
        }

        // Validar largo de los campos
        if (codigo.length > 10) {
            errors.push('La longitud del campo "codigo" no puede ser mayor a 10 caracteres');
        }
        if (descripcion.length > 100) {
            errors.push('La longitud del campo "descripcion" no puede ser mayor a 100 caracteres');
        }

        // Validar si ya existe la clave
        const [claveExists] = await pool.query('SELECT * FROM clave WHERE codigo = ? AND isDeleted = 0', [codigo]);
        if (claveExists.length > 0) {
            errors.push('La clave ya existe');
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Insertar nueva clave
        const [rows] = await pool.query("INSERT INTO clave (codigo, descripcion, isDeleted) VALUES (?, ?, 0)", [codigo, descripcion]);
        
        // Responder con el id de la nueva clave
        res.status(201).json({ id: rows.insertId, codigo, descripcion });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Dar de baja clave (marcar como inactiva)
export const deleteClave = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }

        const [result] = await pool.query("UPDATE clave SET isDeleted = 1 WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Clave no encontrada" });
        res.status(204).end();
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Actualizar clave
export const updateClave = async (req, res) => {
    const { id } = req.params;
    const { codigo, descripcion, isDeleted } = req.body;

    try {
        const errors = [];  // Arreglo para almacenar los errores

        // Validar el ID
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        // Validaciones para 'codigo'
        if (codigo !== undefined) {
            if (typeof codigo !== "string") {
                errors.push("Tipo de dato inválido para 'codigo'");
            } else if (codigo.length > 10) {
                errors.push("La longitud del campo 'codigo' no puede ser mayor a 10 caracteres");
            } else {
                // Validar si el código ya existe en otro registro
                const [codigoExists] = await pool.query('SELECT * FROM clave WHERE codigo = ? AND isDeleted = 0 AND id != ?', [codigo, idNumber]);
                if (codigoExists.length > 0) {
                    errors.push("El código ya existe para otra clave");
                }
            }
        }

        // Validaciones para 'descripcion'
        if (descripcion !== undefined) {
            if (typeof descripcion !== "string") {
                errors.push("Tipo de dato inválido para 'descripcion'");
            } else if (descripcion.length > 100) {
                errors.push("La longitud del campo 'descripcion' no puede ser mayor a 100 caracteres");
            }
        }

        // Validaciones para 'isDeleted'
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'. Debe ser 0 o 1.");
            }
        }

        // Si hay errores, devolver todos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Construir la consulta de actualización
        const updates = {};
        if (codigo !== undefined) {
            updates.codigo = codigo;
        }

        if (descripcion !== undefined) {
            updates.descripcion = descripcion;
        }

        if (isDeleted !== undefined) {
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
        const [result] = await pool.query(`UPDATE clave SET ${setClause} WHERE id = ? AND isDeleted = 0`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Clave no encontrada" });
        }

        const [rows] = await pool.query('SELECT * FROM clave WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};