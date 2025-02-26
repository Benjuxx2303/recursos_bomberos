import { pool } from "../db.js";

// Devuelve todos los permisos por rol
export const getRolPermisos = async (req, res) => {
    try {
        const query = `
            SELECT rp.*, p.nombre AS permiso_nombre, r.nombre AS rol_nombre
            FROM rol_permisos rp
            INNER JOIN permiso p ON rp.permiso_id = p.id
            INNER JOIN rol_personal r ON rp.rol_personal_id = r.id
            WHERE rp.isDeleted = 0
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Devuelve rol_permiso por ID
export const getRolPermisoById = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const query = `
            SELECT rp.*, p.nombre AS permiso_nombre, r.nombre AS rol_nombre
            FROM rol_permisos rp
            INNER JOIN permiso p ON rp.permiso_id = p.id
            INNER JOIN rol_personal r ON rp.rol_personal_id = r.id
            WHERE rp.id = ? AND rp.isDeleted = 0
        `;
        
        const [rows] = await pool.query(query, [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Rol-Permiso no encontrado"
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

// Crear rol_permiso
export const createRolPermiso = async (req, res) => {
    const { rol_personal_id, permiso_id } = req.body;
    let errors = [];

    try {
        if (!rol_personal_id || !permiso_id) {
            errors.push("Faltan campos requeridos");
        }

        // Validación de existencia de rol y permiso
        const [rolExists] = await pool.query("SELECT * FROM rol_personal WHERE id = ?", [rol_personal_id]);
        const [permisoExists] = await pool.query("SELECT * FROM permiso WHERE id = ?", [permiso_id]);

        if (rolExists.length === 0) {
            errors.push("Rol no encontrado");
        }
        if (permisoExists.length === 0) {
            errors.push("Permiso no encontrado");
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Crear el rol_permiso
        const [rows] = await pool.query("INSERT INTO rol_permisos (rol_personal_id, permiso_id, isDeleted) VALUES (?, ?, 0)", [rol_personal_id, permiso_id]);
        res.status(201).json({
            id: rows.insertId,
            rol_personal_id,
            permiso_id
        });

    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Dar de baja rol_permiso
export const deleteRolPermiso = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query("UPDATE rol_permisos SET isDeleted = 1 WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Rol-Permiso no encontrado"
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

        // Obtener permisos actuales
        const [permisosActuales] = await pool.query(
            "SELECT permiso_id FROM rol_permisos WHERE rol_personal_id = ? AND isDeleted = false",
            [idNumber]
        );

        const permisosActualesIds = permisosActuales.map(p => p.permiso_id);
        const permisosNuevos = permisoIds.filter(id => !permisosActualesIds.includes(id));
        const permisosBorrados = permisosActualesIds.filter(id => !permisoIds.includes(id));

        // Marcar como eliminados los permisos que ya no están en la lista
        if (permisosBorrados.length > 0) {
            await pool.query(
                "UPDATE rol_permisos SET isDeleted = true WHERE rol_personal_id = ? AND permiso_id IN (?)",
                [idNumber, permisosBorrados]
            );
        }

        // Insertar solo los permisos nuevos
        for (const permisoId of permisosNuevos) {
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
            message: "Permisos actualizados correctamente",
            cambios: {
                agregados: permisosNuevos.length,
                eliminados: permisosBorrados.length
            }
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

// Actualizar rol_permiso
export const updateRolPermiso = async (req, res) => {
    const { id } = req.params;
    const { rol_personal_id, permiso_id, isDeleted } = req.body;
    let errors = [];

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        const updates = {};

        // Validar rol_personal_id
        if (rol_personal_id !== undefined) {
            updates.rol_personal_id = rol_personal_id;
        }

        // Validar permiso_id
        if (permiso_id !== undefined) {
            updates.permiso_id = permiso_id;
        }

        // Validar isDeleted
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
        const [result] = await pool.query(`UPDATE rol_permisos SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Rol-Permiso no encontrado"
            });
        }

        const [rows] = await pool.query("SELECT * FROM rol_permisos WHERE id = ?", [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};