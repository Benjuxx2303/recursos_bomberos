import { pool } from "../db.js";

// Obtener todas las claves
export const getClaves = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clave WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message,
        });
    }
};

export const getClavesPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales para paginación
        const page = parseInt(req.query.page) || 1; // Página actual, por defecto es la primera
        const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de página, por defecto son 10 registros

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const [rows] = await pool.query('SELECT * FROM clave WHERE isDeleted = 0');
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        // Consulta paginada
        const query = `
            SELECT * 
            FROM clave 
            WHERE isDeleted = 0
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.query(query, [pageSize, offset]);
        res.json(rows);
    } catch (error) {
        console.error('Error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
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
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Crear nueva clave
export const createClave = async (req, res) => {
    let { nombre, descripcion } = req.body;
    const errors = []; // Arreglo para capturar errores

    try {
        // Validar que nombre y descripcion no sean vacíos
        if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
            errors.push('El campo "nombre" no puede estar vacío');
        }

        if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0) {
            errors.push('El campo "descripcion" no puede estar vacío');
        }

        // Validar largo de campos
        if (nombre && nombre.length > 10) {
            errors.push('El largo del código no debe exceder 10 caracteres');
        }
        if (descripcion && descripcion.length > 100) {
            errors.push('El largo de la descripción no debe exceder 100 caracteres');
        }

        // Validar si ya existe una clave con el mismo código
        if (nombre) {
            const [claveExists] = await pool.query('SELECT * FROM clave WHERE nombre = ? AND isDeleted = 0', [nombre]);
            if (claveExists.length > 0) {
                errors.push('Ya existe una clave con el mismo código');
            }
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Insertar nueva clave
        const [rows] = await pool.query("INSERT INTO clave (nombre, descripcion, isDeleted) VALUES (?, ?, 0)", [nombre, descripcion]);
        res.status(201).json({ id: rows.insertId, nombre, descripcion });
    } catch (error) {
        errors.push(error.message);
        return res.status(500).json({ message: 'Error interno del servidor', errors });
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
        console.error('Error: ', error.message);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Actualizar clave
export const updateClave = async (req, res) => {
    const { id } = req.params;
    let { nombre, descripcion, isDeleted } = req.body;
    const errors = []; // Arreglo para capturar errores

    try {
        // Validación del ID
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
            return res.status(400).json({ errors });
        }

        // Comprobar si la clave existe
        const [clave] = await pool.query('SELECT * FROM clave WHERE id = ? AND isDeleted = 0', [idNumber]);
        if (clave.length === 0) {
            return res.status(404).json({ message: "Clave no encontrada" });
        }

        // Validaciones de datos
        const updates = {};

        // Validación del campo 'nombre'
        if (nombre !== undefined) {
            nombre = String(nombre).trim();
            if (nombre.length > 10) {
                errors.push("El largo del nombre no debe exceder 10 caracteres");
            }
            updates.nombre = nombre;
        }

        // Validación del campo 'descripcion'
        if (descripcion !== undefined) {
            descripcion = String(descripcion).trim();
            updates.descripcion = descripcion;
        }

        // Validación del campo 'isDeleted'
        if (isDeleted !== undefined) {
            if (![0, 1].includes(isDeleted)) {
                errors.push("Valor inválido para 'isDeleted'. Debe ser 0 o 1.");
            }
            updates.isDeleted = isDeleted;
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Si no se proporciona nada para actualizar, retornar un error
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        }

        // Construir la consulta de actualización
        const setClause = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ");
        
        // Ejecutar la actualización
        const values = Object.values(updates).concat(idNumber);
        const [result] = await pool.query(`UPDATE clave SET ${setClause} WHERE id = ? AND isDeleted = 0`, values);

        // Si no se actualizó ninguna fila (clave no encontrada o está eliminada)
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Clave no encontrada o ya eliminada" });
        }

        // Si la clave fue actualizada correctamente, devolver los datos actualizados
        const [rows] = await pool.query('SELECT * FROM clave WHERE id = ?', [idNumber]);
        res.status(200).json(rows[0]);
    } catch (error) {
        // Manejo de error interno del servidor
        console.error('Error: ', error);  // Añadir logs más detallados para depurar
        return res.status(500).json({
            message: "Error interno del servidor",
            errors: [error.message],
        });
    }
};