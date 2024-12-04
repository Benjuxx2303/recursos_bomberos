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
    const { clasificacion } = req.body;
    const errors = [];  // Arreglo para almacenar los errores de validación

    try {
        // Validar clasificacion
        if (typeof clasificacion !== 'string') {
            errors.push("Tipo de dato inválido para 'clasificacion'");
        }

        // Validar si el tipo de máquina ya existe
        const [tipoMaquinaExists] = await pool.query("SELECT * FROM tipo_maquina WHERE clasificacion = ? AND isDeleted = 0", [clasificacion]);
        if (tipoMaquinaExists.length > 0) {
            errors.push("El tipo de máquina ya existe");
        }

        // Si hay errores, devolver todos juntos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Insertar nuevo tipo de máquina
        const [rows] = await pool.query("INSERT INTO tipo_maquina (clasificacion, isDeleted) VALUES (?, 0)", [clasificacion]);
        res.status(201).json({
            id: rows.insertId,
            clasificacion
        });
    } catch (error) {
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
    const { clasificacion, isDeleted } = req.body;
    const errors = [];  // Arreglo para almacenar los errores de validación

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        const updates = {};

        // Validar clasificacion
        if (clasificacion !== undefined) {
            if (typeof clasificacion !== 'string') {
                errors.push('Tipo de dato inválido para "clasificacion"');
            }
            // Verificar si el tipo de máquina ya existe
            const [tipoMaquinaExists] = await pool.query("SELECT * FROM tipo_maquina WHERE clasificacion = ? AND isDeleted = 0", [clasificacion]);
            if (tipoMaquinaExists.length > 0) {
                errors.push("El tipo de máquina ya existe");
            }
            updates.clasificacion = clasificacion;
        }

        // Validar isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            }
            updates.isDeleted = isDeleted;
        }

        // Si hay errores, devolverlos todos juntos
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

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Tipo de máquina no encontrado"
            });
        }

        const [rows] = await pool.query("SELECT * FROM tipo_maquina WHERE id = ?", [idNumber]);
        res.json(rows[0]);

    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};
