import { pool } from "../db.js";

// Obtener todas las categorías
export const getCategorias = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM categoria WHERE isDeleted IS NULL OR isDeleted = false");
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

export const getPermisos = async (req, res) => {
    try {
        const { categoriaId, rolPersonalId, search, assignedStatus } = req.query;
        let query = `
            SELECT p.*, c.nombre as categoria_nombre 
            FROM permiso p
            LEFT JOIN categoria c ON p.categoria_id = c.id
            WHERE (p.isDeleted IS NULL OR p.isDeleted = false)
        `;
        const params = [];

        if (categoriaId) {
            query += " AND p.categoria_id = ?";
            params.push(parseInt(categoriaId));
        }

        if (search) {
            query += " AND (p.nombre LIKE ? OR p.descripcion LIKE ?)";
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        if (assignedStatus && rolPersonalId) {
            if (assignedStatus === "asignado") {
                query += ` AND EXISTS (
                    SELECT 1 FROM rol_permisos rp 
                    WHERE rp.permiso_id = p.id 
                    AND rp.rol_personal_id = ?
                    AND (rp.isDeleted IS NULL OR rp.isDeleted = false)
                )`;
                params.push(parseInt(rolPersonalId));
            } else if (assignedStatus === "no_asignado") {
                query += ` AND NOT EXISTS (
                    SELECT 1 FROM rol_permisos rp 
                    WHERE rp.permiso_id = p.id 
                    AND rp.rol_personal_id = ?
                    AND (rp.isDeleted IS NULL OR rp.isDeleted = false)
                )`;
                params.push(parseInt(rolPersonalId));
            }
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};


// Devuelve permiso por ID
export const getPermisoById = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }
        
        const [rows] = await pool.query(`
            SELECT p.*, c.nombre as categoria_nombre 
            FROM permiso p
            LEFT JOIN categoria c ON p.categoria_id = c.id
            WHERE p.id = ? AND (p.isDeleted IS NULL OR p.isDeleted = false)
        `, [idNumber]);

        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Permiso no encontrado"
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

// Obtener permisos por rol
export const getPermisosByRol = async (req, res) => {
    const { rolId } = req.params;
    try {
        const idNumber = parseInt(rolId);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "ID de rol inválido"
            });
        }

        const [rows] = await pool.query(`
            SELECT p.*, c.nombre as categoria_nombre 
            FROM permiso p
            LEFT JOIN categoria c ON p.categoria_id = c.id
            INNER JOIN rol_permisos rp ON p.id = rp.permiso_id
            WHERE rp.rol_personal_id = ? 
            AND (p.isDeleted IS NULL OR p.isDeleted = false)
            AND (rp.isDeleted IS NULL OR rp.isDeleted = false)
        `, [idNumber]);

        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Asignar permisos a un rol
export const asignarPermisosRol = async (req, res) => {
    const { rolId } = req.params;
    const { permisoIds } = req.body;
    
    try {
        const idNumber = parseInt(rolId);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "ID de rol inválido"
            });
        }

        if (!Array.isArray(permisoIds)) {
            return res.status(400).json({
                message: "permisoIds debe ser un array"
            });
        }

        // Iniciar transacción
        await pool.query("START TRANSACTION");

        // Marcar como eliminados los permisos actuales del rol
        await pool.query(
            "UPDATE rol_permisos SET isDeleted = true WHERE rol_personal_id = ?",
            [idNumber]
        );

        // Insertar nuevos permisos
        for (const permisoId of permisoIds) {
            await pool.query(
                `INSERT INTO rol_permisos (rol_personal_id, permiso_id) 
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE isDeleted = false`,
                [idNumber, permisoId]
            );
        }

        // Confirmar transacción
        await pool.query("COMMIT");

        res.status(200).json({
            message: "Permisos asignados correctamente"
        });
    } catch (error) {
        // Revertir transacción en caso de error
        await pool.query("ROLLBACK");
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Crear permiso
export const createPermiso = async (req, res) => {
    let { nombre, descripcion } = req.body;
    let errors = [];

    try {
        nombre = String(nombre).trim();
        descripcion = descripcion ? String(descripcion).trim() : null;

        // Validación de datos
        if (!nombre || typeof nombre !== "string") {
            errors.push("Tipo de datos inválido para 'nombre'");
        }

        if (descripcion && typeof descripcion !== 'string') {
            errors.push("Tipo de datos inválido para 'descripcion'");
        }

        // Validar largo de nombre
        if (nombre.length > 45) {
            errors.push('El nombre debe tener un largo máximo de 45 caracteres');
        }

        // Validar largo de descripción
        if (descripcion && descripcion.length > 45) {
            errors.push('La descripción debe tener un largo máximo de 45 caracteres');
        }

        // Validar si existe permiso con el mismo nombre
        const [permisoExists] = await pool.query("SELECT * FROM permiso WHERE nombre = ?", [nombre]);
        if (permisoExists.length > 0) {
            errors.push('Ya existe un permiso con ese nombre');
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Crear el permiso
        const [rows] = await pool.query("INSERT INTO permiso (nombre, descripcion) VALUES (?, ?)", [nombre, descripcion]);
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

// Actualizar permiso
export const updatePermiso = async (req, res) => {
    const { id } = req.params;
    let { nombre, descripcion } = req.body;
    let errors = [];

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        const updates = {};
        if (nombre !== undefined) {
            nombre = String(nombre).trim();
            if (typeof nombre !== 'string' || nombre.length === 0) {
                errors.push('Tipo de dato inválido para "nombre"');
            } else if (nombre.length > 45) {
                errors.push('El nombre debe tener un largo máximo de 45 caracteres');
            } else {
                updates.nombre = nombre;
            }
        }

        if (descripcion !== undefined) {
            descripcion = descripcion ? String(descripcion).trim() : null;
            if (descripcion && typeof descripcion !== 'string') {
                errors.push('Tipo de dato inválido para "descripcion"');
            } else if (descripcion && descripcion.length > 45) {
                errors.push('La descripción debe tener un largo máximo de 45 caracteres');
            } else {
                updates.descripcion = descripcion;
            }
        }

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

        const values = Object.values(updates).concat(idNumber);
        const [result] = await pool.query(`UPDATE permiso SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Permiso no encontrado"
            });
        }

        const [rows] = await pool.query("SELECT * FROM permiso WHERE id = ?", [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Dar de baja permiso
export const deletePermiso = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query("DELETE FROM permiso WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Permiso no encontrado"
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