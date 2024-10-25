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

    try {
        if (typeof clasificacion !== 'string') {
            return res.status(400).json({
                message: 'Tipo de datos inválido'
            });
        }

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

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "ID inválido"
            });
        }

        // Validaciones
        const updates = {};
        if (clasificacion !== undefined) {
            if (typeof clasificacion !== 'string') {
                return res.status(400).json({
                    message: 'Tipo de dato inválido para "clasificacion"'
                });
            }
            updates.clasificacion = clasificacion;
        }

        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                return res.status(400).json({
                    message: "Tipo de dato inválido para 'isDeleted'"
                });
            }
            updates.isDeleted = isDeleted;
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
