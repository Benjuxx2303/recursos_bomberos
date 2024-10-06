import { pool } from "../db.js";

// Obtener todas las claves
export const getClaves = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clave WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// Obtener clave por ID
export const getClaveById = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }
        
        const [rows] = await pool.query('SELECT * FROM clave WHERE id = ? AND isDeleted = 0', [idNumber]);
        if (rows.length <= 0) return res.status(404).json({ message: "Clave no encontrada" });
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Crear nueva clave
export const createClave = async (req, res) => {
    const { codigo, descripcion } = req.body;
    try {
        if (typeof codigo !== 'string' || typeof descripcion !== 'string') {
            return res.status(400).json({ message: 'Tipo de datos inválido' });
        }

        const [rows] = await pool.query("INSERT INTO clave (codigo, descripcion, isDeleted) VALUES (?, ?, 0)", [codigo, descripcion]);
        res.status(201).json({ id: rows.insertId, codigo, descripcion });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Dar de baja clave (marcar como inactiva)
export const deleteClave = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }

        const [result] = await pool.query("UPDATE clave SET isDeleted = 1 WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Clave no encontrada" });
        res.status(204).end();
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Actualizar clave
export const updateClave = async (req, res) => {
    const { id } = req.params;
    const { codigo, descripcion, isDeleted } = req.body;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "ID inválido" });
        }

        // Validaciones
        const updates = {};
        if (codigo !== undefined) {
            if (typeof codigo !== "string") {
                return res.status(400).json({
                    message: "Tipo de dato inválido para 'codigo'"
                });
            }
            updates.codigo = codigo;
        }

        if (descripcion !== undefined) {
            if (typeof descripcion !== "string") {
                return res.status(400).json({
                    message: "Tipo de dato inválido para 'descripcion'"
                });
            }
            updates.descripcion = descripcion;
        }

        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                return res.status(400).json({
                    message: "Tipo de dato inválido para 'isDeleted'. Debe ser 0 o 1."
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
        const [result] = await pool.query(`UPDATE clave SET ${setClause} WHERE id = ? AND isDeleted = 0`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Clave no encontrada" });
        }

        const [rows] = await pool.query('SELECT * FROM clave WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
