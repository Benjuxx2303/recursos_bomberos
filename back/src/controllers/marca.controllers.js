import { pool } from "../db.js";

// Devuelve todas las marcas con paginación opcional
export const getMarcasPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales
        const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const query = "SELECT * FROM marca";
            const [rows] = await pool.query(query);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT * 
            FROM marca
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

// Devuelve marca por ID
export const getMarcaById = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }
        
        const [rows] = await pool.query("SELECT * FROM marca WHERE id = ?", [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Marca no encontrada"
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

// Crear una nueva marca
export const createMarca = async (req, res) => {
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
            errors.push('El nombre de la marca debe tener un largo máximo de 45 caracteres');
        }

        // Validar si ya existe una marca con el mismo nombre
        const [marcaExists] = await pool.query("SELECT * FROM marca WHERE nombre = ?", [nombre]);
        if (marcaExists.length > 0) {
            errors.push('Ya existe una marca con ese nombre');
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Crear la marca
        const [rows] = await pool.query("INSERT INTO marca (nombre) VALUES (?)", [nombre]);
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

// Actualizar una marca
export const updateMarca = async (req, res) => {
    const { id } = req.params;
    let { nombre } = req.body;
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
                errors.push('El nombre de la marca debe tener un largo máximo de 45 caracteres');
            } else {
                // Validar si existe marca con el mismo nombre
                const [marcaExists] = await pool.query(
                    "SELECT COUNT(*) AS count FROM marca WHERE nombre = ? AND id != ?", 
                    [nombre, idNumber]
                );

                if (marcaExists[0].count > 0) {
                    errors.push('Ya existe una marca con ese nombre');
                }
            }

            // Solo agregar al objeto updates si no hay errores
            if (errors.length === 0) {
                updates.nombre = nombre;
            }
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
        const [result] = await pool.query(`UPDATE marca SET ${setClause} WHERE id = ?`, values);

        // Verifica si no se afectaron filas (marca no encontrada)
        if (result.affectedRows === 0) {
            return res.status(404).json({
                errors: ["Marca no encontrada"] 
            });
        }

        const [rows] = await pool.query("SELECT * FROM marca WHERE id = ?", [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Dar de baja una marca
export const deleteMarca = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query("DELETE FROM marca WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Marca no encontrada"
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
