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

export const createCompania = async(req, res) =>{
    const {nombre}= req.body
    try{
        // validacion de datos
        if (typeof nombre !== "string") {
          return res.status(400).json({
            message: "Tipo de datos inválido",
          });
        }
        // activo por defecto
        const [rows] = await pool.query('INSERT INTO compania (nombre, isDeleted) VALUES (?, 0)', [nombre])
        res.send({
            id: rows.insertId,
            nombre
        });
    } catch (error){
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        })
    }
}

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

export const updateCompania = async (req, res) => {
    const { id } = req.params;
    const { nombre, isDeleted } = req.body;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "ID inválido"
            });
        }

        // Validaciones
        const updates = {};
        if (nombre !== undefined) {
            if (typeof nombre !== "string") {
                return res.status(400).json({
                    message: "Tipo de dato inválido para 'nombre'"
                });
            }
            updates.nombre = nombre;
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
        const [result] = await pool.query(`UPDATE compania SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Compañía no encontrada'
            });
        }

        const [rows] = await pool.query('SELECT * FROM compania WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message,
        });
    }
};