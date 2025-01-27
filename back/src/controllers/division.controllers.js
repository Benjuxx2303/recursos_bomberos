import { pool } from "../db.js";

// Obtener todas las divisiones (solo activas)
export const getDivisiones = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM division WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// paginacion 
export const getDivisionesPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales
        const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const [rows] = await pool.query('SELECT * FROM division WHERE isDeleted = 0');
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT * FROM division
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

// Obtener una división por ID (solo activas)
export const getDivision = async (req, res) => {
    try {
        const { id } = req.params;
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [rows] = await pool.query('SELECT * FROM division WHERE id = ? AND isDeleted = 0', [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: 'División no encontrada'
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

// Crear una nueva división
export const createDivision = async (req, res) => {
    let { nombre } = req.body;
    const errors = []; // Arreglo para capturar errores
  
    try {
        nombre = String(nombre).trim();
        // Validación de tipo de datos
        if (typeof nombre !== "string") {
          errors.push("Tipo de datos inválido para 'nombre'");
        }
  
        // Validación de longitud del nombre
        if (nombre.length < 3 || nombre.length > 45) {
          errors.push("La longitud del nombre debe estar entre 3 y 45 caracteres");
        }
      
        // Validación si ya existe una división con el mismo nombre
        const [divisionExists] = await pool.query('SELECT * FROM division WHERE nombre = ?', [nombre]);
        if (divisionExists.length > 0) {
          errors.push("Ya existe una división con el mismo nombre");
        }
      
        // Si se encontraron errores, devolverlos
        if (errors.length > 0) {
          return res.status(400).json({ errors });
        }
      
        // Crear la división con isDeleted = 0 por defecto
        const [rows] = await pool.query('INSERT INTO division (nombre, isDeleted) VALUES (?, 0)', [nombre]);
        res.status(201).json({
          id: rows.insertId,
          nombre
        });
    } catch (error) {
        errors.push(error.message);
        return res.status(500).json({ message: "Error interno del servidor", errors });
    }
  };  

// Eliminar una división (marcar como eliminada)
export const deleteDivision = async (req, res) => {
    const { id } = req.params;
    const idNumber = parseInt(id);

    try {
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query('UPDATE division SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) {
            return res.status(404).json({
                message: 'División no encontrada'
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

// Actualizar una división
export const updateDivision = async (req, res) => {
    const { id } = req.params;
    let { nombre, isDeleted } = req.body;
    const idNumber = parseInt(id);
    const errors = []; // Arreglo para capturar errores

    try {
        if (isNaN(idNumber)) {
            errors.push("Tipo de datos inválido para el id");
        }

        const updates = {};
        
        // Validación de nombre
        if (nombre !== undefined) {
            nombre = String(nombre).trim();
            // Validar tipo de datos
            if (typeof nombre !== "string") {
                errors.push("Tipo de datos inválido para 'nombre'");
            }

            // Validar longitud del nombre
            if (nombre.length < 3 || nombre.length > 45) {
                errors.push("La longitud del nombre debe estar entre 3 y 45 caracteres");
            }

            // Validar si ya existe una división con el mismo nombre
            const [divisionExists] = await pool.query('SELECT * FROM division WHERE nombre = ? AND id != ?', [nombre, idNumber]);
            if (divisionExists.length > 0) {
                errors.push("Ya existe una división con el mismo nombre");
            }

            updates.nombre = nombre;
        }

        // Validación de isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de datos inválido para 'isDeleted'");
            }
            updates.isDeleted = isDeleted;
        }

        // Si se encontraron errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ message: "Errores de validación", errors });
        }

        // Generar la cláusula SET
        const setClause = Object.keys(updates)
            .map(key => `${key} = ?`)
            .join(", ");

        if (!setClause) {
            errors.push("No se proporcionaron campos para actualizar");
            return res.status(400).json({ errors }); // Devolver errores de validación
        }

        const values = Object.values(updates).concat(idNumber);
        const [result] = await pool.query(`UPDATE division SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            errors.push("División no encontrada");
            return res.status(404).json({ message: "Errores de validación", errors });
        }

        const [rows] = await pool.query('SELECT * FROM division WHERE id = ?', [idNumber]);
        res.json(rows[0]);

    } catch (error) {
        errors.push(error.message);
        return res.status(500).json({ message: "Error interno del servidor", errors });
    }
};
