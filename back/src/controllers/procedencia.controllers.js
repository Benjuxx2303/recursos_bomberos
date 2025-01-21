import { pool } from "../db.js";

// Obtener todas las procedencias
export const getProcedencias = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM procedencia WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
}

// Obtener todas las procedencias con paginación opcional
export const getProcedenciasPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales: "page" y "pageSize"
        const page = parseInt(req.query.page) || 1; // Página por defecto es 1
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

        // Si no se proporciona "page", devolver todos los registros sin paginación
        if (!req.query.page) {
            const query = `
                SELECT * 
                FROM procedencia 
                WHERE isDeleted = 0
            `;
            const [rows] = await pool.query(query);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset para la paginación

        const query = `
            SELECT * 
            FROM procedencia 
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

// Obtener procedencia por ID
export const getProcedenciaById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM procedencia WHERE id = ? AND isDeleted = 0', [id]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Procedencia no encontrada"
            });
        }
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
}

// Crear una nueva procedencia
export const createProcedencia = async (req, res) => {
    let { nombre } = req.body;
    let errors = [];

    try {
        nombre = nombre.trim();

        // Validación de datos
        if (typeof nombre !== 'string' || nombre === '') {
            errors.push('Nombre es un campo obligatorio y debe ser una cadena válida');
        }

        // Validar longitud de nombre
        if (nombre.length > 30) {
            errors.push('Nombre no puede tener más de 30 caracteres');
        }

        // Validar si ya existe la procedencia
        const [procedenciaExists] = await pool.query("SELECT * FROM procedencia WHERE nombre = ?", [nombre]);
        if (procedenciaExists.length > 0) {
            errors.push('Ya existe una procedencia con ese nombre');
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors }); // Devuelve un arreglo con los errores
        }

        // Insertar la nueva procedencia
        const [rows] = await pool.query("INSERT INTO procedencia(nombre, isDeleted) VALUES(?, 0)", [nombre]);
        res.status(201).json({
            id: rows.insertId,
            nombre
        });
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Cambiar estado a 'eliminado'
export const deleteProcedencia = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("UPDATE procedencia SET isDeleted = 1 WHERE id = ?", [id]);
        if (result.affectedRows <= 0) {
            return res.status(404).json({
                message: "Procedencia no encontrada"
            });
        }
        res.status(204).end();
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
}

// Actualizar procedencia
export const updateProcedencia = async (req, res) => {
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
        if (nombre !== undefined) {
            nombre = nombre.trim();
            // Validar nombre
            if (typeof nombre !== 'string') {
                errors.push('Nombre es un campo obligatorio y debe ser una cadena válida');
            }

            // Validar longitud de nombre
            if (nombre.length > 30) {
                errors.push('Nombre no puede tener más de 30 caracteres');
            }

            // Validar si ya existe la procedencia con el mismo nombre (excluyendo el ID actual)
            const [rows] = await pool.query('SELECT COUNT(*) AS count FROM procedencia WHERE nombre = ? AND id != ?', [nombre, idNumber]);
            if (rows[0] && rows[0].count > 0) {
                errors.push('Ya existe una procedencia con ese nombre');
            }

            updates.nombre = nombre;
        }

        if (isDeleted !== undefined) {
            if (typeof isDeleted !== 'number' || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            }
            updates.isDeleted = isDeleted;
        }

        // Si se encontraron errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors }); // Devuelve un arreglo con los errores
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
        const [result] = await pool.query(`UPDATE procedencia SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Procedencia no encontrada"
            });
        }

        const [rowsUpdated] = await pool.query("SELECT * FROM procedencia WHERE id = ?", [idNumber]);
        res.json(rowsUpdated[0]);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};
