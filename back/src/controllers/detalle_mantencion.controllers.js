import { pool } from "../db.js";

// Obtener todos los detalles de mantención con joins
export const getDetallesMantencion = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT dm.*, 
                   m.ord_trabajo, 
                   s.descripcion AS servicio
            FROM detalle_mantencion dm
            INNER JOIN mantencion m ON dm.mantencion_id = m.id
            INNER JOIN servicio s ON dm.servicio_id = s.id
            WHERE dm.isDeleted = 0
        `);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Paginación
export const getDetallesMantencionPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        if (!req.query.page) {
            const query = `
                SELECT dm.*, 
                       m.ord_trabajo, 
                       s.descripcion AS servicio
                FROM detalle_mantencion dm
                INNER JOIN mantencion m ON dm.mantencion_id = m.id
                INNER JOIN servicio s ON dm.servicio_id = s.id
                WHERE dm.isDeleted = 0
            `;
            const [rows] = await pool.query(query);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        const query = `
            SELECT dm.*, 
                   m.ord_trabajo, 
                   s.descripcion AS servicio
            FROM detalle_mantencion dm
            INNER JOIN mantencion m ON dm.mantencion_id = m.id
            INNER JOIN servicio s ON dm.servicio_id = s.id
            WHERE dm.isDeleted = 0
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

// Obtener detalle de mantención por ID con joins
export const getDetalleMantencion = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }

        const [rows] = await pool.query(`
            SELECT dm.*, 
                   m.ord_trabajo, 
                   s.descripcion AS servicio
            FROM detalle_mantencion dm
            INNER JOIN mantencion m ON dm.mantencion_id = m.id
            INNER JOIN servicio s ON dm.servicio_id = s.id
            WHERE dm.id = ? AND dm.isDeleted = 0
        `, [idNumber]);

        if (rows.length <= 0) return res.status(404).json({ message: 'Detalle de mantención no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Obtener detalles de mantención por ID de mantención
export const getDetalleMantencionByMantencionID = async (req, res) => {
    const { mantencion_id } = req.params;

    try {
        const mantencionIdNumber = parseInt(mantencion_id);
        if (isNaN(mantencionIdNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }

        const [rows] = await pool.query(`
            SELECT dm.*, 
                   m.ord_trabajo, 
                   s.descripcion AS servicio
            FROM detalle_mantencion dm
            INNER JOIN mantencion m ON dm.mantencion_id = m.id
            INNER JOIN servicio s ON dm.servicio_id = s.id
            WHERE dm.mantencion_id = ? AND dm.isDeleted = 0
        `, [mantencionIdNumber]);

        if (rows.length <= 0) return res.status(404).json({ message: 'No se encontraron detalles de mantención para esta mantención' });
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Crear un nuevo detalle de mantención
// Crear un nuevo detalle de mantención
export const createDetalleMantencion = async (req, res) => {
    const { mantencion_id, observacion, servicio_id } = req.body;
    const errors = [];

    try {
        // Validación de existencia de mantención
        const [mantencionExists] = await pool.query(
            "SELECT 1 FROM mantencion WHERE id = ? AND isDeleted = 0", 
            [mantencion_id]
        );
        if (!mantencionExists || mantencionExists.length === 0) {
            errors.push("Mantención no existe o está eliminada");
        }

        // Validación de existencia de servicio
        const [servicioExists] = await pool.query(
            "SELECT 1 FROM servicio WHERE id = ? AND isDeleted = 0", 
            [servicio_id]
        );
        if (!servicioExists || servicioExists.length === 0) {
            errors.push("Servicio no existe o está eliminado");
        }

        // Si se encontraron errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Crear detalle de mantención
        const [rows] = await pool.query(
            `
            INSERT INTO detalle_mantencion (mantencion_id, observacion, servicio_id, isDeleted) 
            VALUES (?, ?, ?, 0)
            `, 
            [mantencion_id, observacion, servicio_id]
        );

        return res.status(201).json({
            id: rows.insertId,
            mantencion_id,
            observacion,
            servicio_id,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            errors: [error.message],
        });
    }
};


// Eliminar detalle de mantención
export const deleteDetalleMantencion = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }

        const [result] = await pool.query('UPDATE detalle_mantencion SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) return res.status(404).json({ message: 'Detalle de mantención no encontrado' });
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Actualizar detalle de mantención
export const updateDetalleMantencion = async (req, res) => {
    const { id } = req.params;
    const { mantencion_id, observacion, servicio_id, isDeleted } = req.body;
    const errors = [];

    try {
        // Validar el ID
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        const updates = {};

        // Validación de existencia de mantención
        if (mantencion_id !== undefined) {
            const [mantencionExists] = await pool.query("SELECT 1 FROM mantencion WHERE id = ? AND isDeleted = 0", [mantencion_id]);
            // Verificar si la respuesta es un array y si tiene elementos
            if (!mantencionExists || mantencionExists.length === 0) {
                errors.push("Mantención no existe o está eliminada");
            } else {
                updates.mantencion_id = mantencion_id;
            }
        }

        // Validación de existencia de servicio
        if (servicio_id !== undefined) {
            const [servicioExists] = await pool.query("SELECT 1 FROM servicio WHERE id = ? AND isDeleted = 0", [servicio_id]);
            if (servicioExists.length === 0) {
                errors.push("Servicio no existe o está eliminado");
            } else {
                updates.servicio_id = servicio_id;
            }
        }

        // Validación de observación
        if (observacion !== undefined) {
            if (typeof observacion !== "string") {
                errors.push("Tipo de dato inválido para 'observacion'");
            } else {
                updates.observacion = observacion;
            }
        }

        // Validación de isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            } else {
                updates.isDeleted = isDeleted;
            }
        }

        // Si se encontraron errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Preparar la consulta de actualización
        const setClause = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ");

        if (!setClause) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        }

        const values = Object.values(updates).concat(idNumber);
        const [result] = await pool.query(`UPDATE detalle_mantencion SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Detalle de mantención no encontrado' });
        }

        const [rows] = await pool.query('SELECT * FROM detalle_mantencion WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", errors: [error.message] });
    }
};
