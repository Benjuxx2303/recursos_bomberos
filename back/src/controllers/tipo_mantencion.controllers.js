import { pool } from "../db.js";

// Obtener todas las mantenciones activas
export const getTipoMantenciones = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM tipo_mantencion WHERE isDeleted = 0");
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Error del servidor"
        });
    }
};

// Obtener tipo de mantención por ID (solo activos)
export const getTipoMantencionById = async (req, res) => {
    const { id } = req.params;

    // Validación de datos
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
        return res.status(400).json({
            message: "Tipo de datos inválido",
        });
    }

    try {
        const [rows] = await pool.query("SELECT * FROM tipo_mantencion WHERE id = ? AND isDeleted = 0", [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Tipo de mantención no encontrada"
            });
        }
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Error del servidor"
        });
    }
};

// Crear tipo de mantención
export const createTipoMantencion = async (req, res) => {
    const { nombre } = req.body;

    // Validación de datos
    if (typeof nombre !== "string") {
        return res.status(400).json({
            message: "Tipo de datos inválido",
        });
    }

    try {
        // Se crea activo (isDeleted = 0) por defecto
        const [rows] = await pool.query("INSERT INTO tipo_mantencion (nombre, isDeleted) VALUES (?, 0)", [nombre]);
        res.status(201).send({
            id: rows.insertId,
            nombre,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Error del servidor"
        });
    }
};

// Eliminar tipo de mantención (marcar como eliminado)
export const deleteTipoMantencion = async (req, res) => {
    const { id } = req.params;

    // Validación de datos
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
        return res.status(400).json({
            message: "Tipo de datos inválido"
        });
    }

    try {
        const [result] = await pool.query("UPDATE tipo_mantencion SET isDeleted = 1 WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Tipo de mantención no encontrada"
            });
        }
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Error del servidor"
        });
    }
};

// Actualizar tipo de mantención
export const updateTipoMantencion = async (req, res) => {
    const { id } = req.params;
    const { nombre, isDeleted } = req.body;

    try {
        // Validación de existencia de llaves foráneas
        const updates = {};

        if (nombre !== undefined) {
            if (typeof nombre !== "string") {
                return res.status(400).json({ message: "Tipo de dato inválido para 'nombre'" });
            }
            updates.nombre = nombre;
        }

        // Validar y agregar isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                return res.status(400).json({ message: "Tipo de dato inválido para 'isDeleted'" });
            }
            updates.isDeleted = isDeleted;
        }

        // Verificar si hay campos a actualizar
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        }

        const setClause = Object.keys(updates)
            .map(key => `${key} = ?`)
            .join(", ");
        
        const values = Object.values(updates).concat(id);

        // Actualizar tipo de mantención en la base de datos
        const [result] = await pool.query(`UPDATE tipo_mantencion SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Tipo de mantención no encontrada" });
        }

        // Obtener el registro actualizado
        const [rows] = await pool.query("SELECT * FROM tipo_mantencion WHERE id = ?", [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: error.message || "Error del servidor" });
    }
};

