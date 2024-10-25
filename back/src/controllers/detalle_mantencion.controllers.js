import { pool } from "../db.js";

// Obtener todos los detalles de mantención con joins
export const getDetallesMantencion = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT dm.*, 
                   m.ord_trabajo, 
                   tm.nombre AS tipo_mantencion, 
                   s.descripcion AS servicio
            FROM detalle_mantencion dm
            INNER JOIN mantencion m ON dm.mantencion_id = m.id
            INNER JOIN tipo_mantencion tm ON dm.tipo_mantencion_id = tm.id
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

// Obtener detalle de mantención por ID con joins
export const getDetalleMantencion = async (req, res) => {
    try {
        const { id } = req.params;
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido",
            });
        }

        const [rows] = await pool.query(`
            SELECT dm.*, 
                   m.ord_trabajo, 
                   tm.nombre AS tipo_mantencion, 
                   s.descripcion AS servicio
            FROM detalle_mantencion dm
            INNER JOIN mantencion m ON dm.mantencion_id = m.id
            INNER JOIN tipo_mantencion tm ON dm.tipo_mantencion_id = tm.id
            INNER JOIN servicio s ON dm.servicio_id = s.id
            WHERE dm.id = ? AND dm.isDeleted = 0
        `, [idNumber]);

        if (rows.length <= 0) return res.status(404).json({
            message: 'detalle_mantencion no encontrado'
        });
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Crear un nuevo detalle de mantención
export const createDetalleMantencion = async (req, res) => {
    const { mantencion_id, tipo_mantencion_id, observacion, servicio_id } = req.body;
    try {
        // Validación de datos
        if (typeof observacion !== "string") {
            return res.status(400).json({
                message: "Tipo de datos inválido",
            });
        }

        // Crear detalle de mantención (isDeleted = 0) por defecto
        const [rows] = await pool.query(`
            INSERT INTO detalle_mantencion (mantencion_id, tipo_mantencion_id, observacion, servicio_id, isDeleted) 
            VALUES (?, ?, ?, ?, 0)
        `, [mantencion_id, tipo_mantencion_id, observacion, servicio_id]);

        res.send({
            id: rows.insertId,
            mantencion_id,
            tipo_mantencion_id,
            observacion,
            servicio_id
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Eliminar detalle de mantención
export const deleteDetalleMantencion = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query('UPDATE detalle_mantencion SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) return res.status(404).json({
            message: 'detalle_mantencion no encontrado'
        });
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
    const { mantencion_id, tipo_mantencion_id, observacion, servicio_id, isDeleted } = req.body;

    try {
        const idNumber = parseInt(id);

        if (
            isNaN(idNumber) ||
            typeof observacion !== "string" ||
            typeof isDeleted !== "number" ||
            (isDeleted !== 0 && isDeleted !== 1)
        ) {
            return res.status(400).json({
                message: "Tipo de datos inválido",
            });
        }

        const [result] = await pool.query(`
            UPDATE detalle_mantencion 
            SET mantencion_id = IFNULL(?, mantencion_id), 
                tipo_mantencion_id = IFNULL(?, tipo_mantencion_id), 
                observacion = IFNULL(?, observacion), 
                servicio_id = IFNULL(?, servicio_id), 
                isDeleted = IFNULL(?, isDeleted) 
            WHERE id = ?
        `, [mantencion_id, tipo_mantencion_id, observacion, servicio_id, isDeleted, idNumber]);

        if (result.affectedRows === 0) return res.status(404).json({
            message: 'detalle_mantencion no encontrado'
        });

        const [rows] = await pool.query('SELECT * FROM detalle_mantencion WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};
