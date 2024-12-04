import {pool} from "../db.js";

export const getCompanias = async(req, res)=>{
    try {
        const [rows] = await pool.query('SELECT * FROM compania WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        })
    }
};

// paginado
export const getCompaniasPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales
        const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const [rows] = await pool.query('SELECT * FROM compania WHERE isDeleted = 0');
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT * 
            FROM compania 
            WHERE isDeleted = 0 
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

// compañia por id (solo activos)
export const getCompania = async(req, res)=>{
    const {id} = req.params;
    try {
        // validacion de datos
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
          res.status(400).json({
            message: "Tipo de datos inválido",
          });
        }
        
        const [rows] = await pool.query('SELECT * FROM compania WHERE id = ? AND isDeleted = 0', [idNumber]);
        if(rows.length <=0) return res.status(404).json({
            message: 'compania no encontrada'
        })
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        })
    }
}

// Crear compañía
export const createCompania = async (req, res) => {
    const { nombre } = req.body;

    try {
        const errors = [];  // Arreglo para almacenar los errores

        // Validación de tipo de datos
        if (typeof nombre !== "string") {
            errors.push("Tipo de datos inválido para 'nombre'");
        }

        // Validación de longitud de los datos
        if (nombre.length > 50) {
            errors.push("La longitud del campo 'nombre' no puede ser mayor a 50 caracteres");
        }

        // Validación de datos duplicados
        const [companias] = await pool.query('SELECT * FROM compania WHERE nombre = ?', [nombre]);
        if (companias.length > 0) {
            errors.push("Ya existe una compañía con el nombre proporcionado");
        }

        // Si hay errores, devolver todos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Insertar la nueva compañía
        const [rows] = await pool.query('INSERT INTO compania (nombre, isDeleted) VALUES (?, 0)', [nombre]);
        res.status(201).json({
            id: rows.insertId,
            nombre
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// eliminar compañia por id
export const deleteCompania = async(req, res) =>{
    const {id} = req.params;
    try {
        // validacion de datos
        const idNumber = parseInt(id);

        if(isNaN(idNumber)){
            res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query('UPDATE compania SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) return res.status(404).json({
            message: 'compania no encontrada'
        })
        res.sendStatus(204)
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        })
    }
}

// Actualizar compañía
export const updateCompania = async (req, res) => {
    const { id } = req.params;
    const { nombre, isDeleted } = req.body;

    try {
        const errors = [];  // Array para almacenar errores

        // Validación de ID
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        // Validación de nombre
        const updates = {};
        if (nombre !== undefined) {
            if (typeof nombre !== "string") {
                errors.push("Tipo de dato inválido para 'nombre'");
            } else if (nombre.length > 50) {
                errors.push("La longitud del campo 'nombre' no puede ser mayor a 50 caracteres");
            } else {
                updates.nombre = nombre;
            }
        }

        // Validación de isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'. Debe ser 0 o 1.");
            } else {
                updates.isDeleted = isDeleted;
            }
        }

        // Si se encontraron errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Verificar si la compañía existe antes de intentar actualizarla
        const [companias] = await pool.query('SELECT * FROM compania WHERE id = ? AND isDeleted = 0', [idNumber]);
        if (companias.length === 0) {
            return res.status(404).json({ message: "Compañía no encontrada o ya eliminada" });
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
        const [result] = await pool.query(`UPDATE compania SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Compañía no encontrada"
            });
        }

        const [rows] = await pool.query('SELECT * FROM compania WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};