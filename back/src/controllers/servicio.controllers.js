import { pool } from "../db.js";

// Obtener todos los servicios (activos) con información de subdivision
export const getServicios = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, sub.nombre AS subdivision
            FROM servicio s
            INNER JOIN subdivision sub ON s.subdivision_id = sub.id
            WHERE s.isDeleted = 0
        `);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Obtener todos los servicios (activos) con información de subdivision y paginación opcional
export const getServiciosPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales de la consulta
        const page = parseInt(req.query.page) || 1; // Página por defecto 1
        const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de página por defecto 10

        // Si no se proporciona "page", devolver todos los registros sin paginación
        if (!req.query.page) {
            const query = `
                SELECT s.*, sub.nombre AS subdivision
                FROM servicio s
                INNER JOIN subdivision sub ON s.subdivision_id = sub.id
                WHERE s.isDeleted = 0
            `;
            const [rows] = await pool.query(query);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", aplicar paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT s.*, sub.nombre AS subdivision
            FROM servicio s
            INNER JOIN subdivision sub ON s.subdivision_id = sub.id
            WHERE s.isDeleted = 0
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

// Obtener un servicio por ID (solo activos) con información de subdivision
export const getServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [rows] = await pool.query(`
            SELECT s.*, sub.nombre AS subdivision
            FROM servicio s
            INNER JOIN subdivision sub ON s.subdivision_id = sub.id
            WHERE s.id = ? AND s.isDeleted = 0
        `, [idNumber]);

        if (rows.length <= 0) {
            return res.status(404).json({
                message: 'Servicio no encontrado'
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

export const updateRolPersonal = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, isDeleted } = req.body;

    const errors = []; // Arreglo para acumular errores

    try {
        // Validación de ID
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        // Crear un objeto para almacenar los campos que se actualizarán
        const updates = {};
        
        // Validación de 'nombre'
        if (nombre !== undefined) {
            if (typeof nombre !== "string") {
                errors.push("Tipo de dato inválido para 'nombre'");
            }

            // Validar si ya existe el rol_personal con ese nombre
            const [rolPersonal] = await pool.query("SELECT * FROM rol_personal WHERE nombre = ?", [nombre]);
            if (rolPersonal.length > 0) {
                errors.push("Ya existe un rol_personal con el mismo nombre");
            }

            if (errors.length === 0) {
                updates.nombre = nombre;
            }
        }

        // Validación de 'descripcion'
        if (descripcion !== undefined) {
            if (typeof descripcion !== "string") {
                errors.push("Tipo de dato inválido para 'descripcion'");
            } else {
                updates.descripcion = descripcion;
            }
        }

        // Validación de 'isDeleted'
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            } else {
                updates.isDeleted = isDeleted;
            }
        }

        // Si hubo errores, los devolvemos
        if (errors.length > 0) {
            return res.status(400).json({
                errors: errors
            });
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
        
        // Ejecutar la actualización en la base de datos
        const [result] = await pool.query(`UPDATE rol_personal SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'rol_personal no encontrado'
            });
        }

        // Obtener el rol actualizado y devolverlo
        const [rows] = await pool.query('SELECT * FROM rol_personal WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            errors: [
                "Error interno del servidor",
                error.message
            ]
        });
    }
};

// Eliminar un servicio (marcar como eliminado)
export const deleteServicio = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query('UPDATE servicio SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) {
            return res.status(404).json({
                message: 'Servicio no encontrado'
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

// Actualizar un servicio
export const updateServicio = async (req, res) => {
    const { id } = req.params;
    const { subdivision_id, descripcion, isDeleted } = req.body;
    const errors = []; // Arreglo para acumular errores

    try {
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            errors.push("Tipo de datos inválido para 'id'");
        }

        const updates = {};

        // Validar y agregar subdivision_id
        if (subdivision_id !== undefined) {
            const [subdivisionExists] = await pool.query("SELECT 1 FROM subdivision WHERE id = ? AND isDeleted = 0", [subdivision_id]);
            if (subdivisionExists.length === 0) {
                errors.push("Subdivision no existe o está eliminada");
            } else {
                updates.subdivision_id = subdivision_id;
            }
        }

        // Validar y agregar descripcion
        if (descripcion !== undefined) {
            if (typeof descripcion !== "string") {
                errors.push("Tipo de datos inválido para 'descripcion'");
            } else {
                updates.descripcion = descripcion;
            }
        }

        // Validar y agregar isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de datos inválido para 'isDeleted'");
            } else {
                updates.isDeleted = isDeleted;
            }
        }

        // Si se han acumulado errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({
                errors: errors
            });
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
        const [result] = await pool.query(`UPDATE servicio SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Servicio no encontrado'
            });
        }

        const [rows] = await pool.query('SELECT * FROM servicio WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        console.error(error); // Registrar el error para depuración
        return res.status(500).json({
            errors: [
                "Error interno del servidor",
                error.message
            ]
        });
    }
};
