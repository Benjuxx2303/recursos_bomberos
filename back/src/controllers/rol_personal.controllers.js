import {pool} from "../db.js";

export const getRolesPersonal = async(req, res)=>{
    try {
        const [rows] = await pool.query('SELECT * FROM rol_personal WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
};

// obtener por id de rol (solo activos)
export const getRolPersonal = async(req, res)=>{
    try {
        const {id} = req.params;

        // validacion de datos
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
          res.status(400).json({
            message: "Tipo de datos inválido",
          });
        }

        const [rows] = await pool.query('SELECT * FROM rol_personal WHERE id = ? AND isDeleted = 0', [idNumber]);
        if(rows.length <=0) return res.status(404).json({
            message: 'rol_personal no encontrado'
        })
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

export const createRolPersonal = async(req, res) =>{
    const {nombre, descripcion} = req.body
    try{
        // validacion de datos
        if (typeof nombre !== "string" || typeof descripcion !== "string") {
          res.status(400).json({
            message: "Tipo de datos inválido",
          });
        }

        // se crea activo (isDeleted = 0) por defecto
        const [rows] = await pool.query('INSERT INTO rol_personal (nombre, descripcion, isDeleted) VALUES (?, ?, 0)', [nombre, descripcion])
        res.send({
            id: rows.insertId,
            nombre,
            descripcion
        });
    } catch (error){
        return res.status(500).json({
            message: error
        })
    }
}

export const deleteRolPersonal = async(req, res) =>{
    const {id} = req.params;
    try {
        // validacion de datos
        const idNumber = parseInt(id)

        if(isNaN(idNumber)){
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }
        
        const [result] = await pool.query('UPDATE rol_personal SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) return res.status(404).json({
            message: 'rol_personal no encontrado'
        })
        res.sendStatus(204)
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

export const updateRolPersonal = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, isDeleted } = req.body;

    try {
        // Validación de datos
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "ID inválido",
            });
        }

        // Crear un objeto para almacenar los campos que se actualizarán
        const updates = {};
        
        if (nombre !== undefined) {
            if (typeof nombre !== "string") {
                return res.status(400).json({
                    message: "Tipo de dato inválido para 'nombre'",
                });
            }
            updates.nombre = nombre;
        }

        if (descripcion !== undefined) {
            if (typeof descripcion !== "string") {
                return res.status(400).json({
                    message: "Tipo de dato inválido para 'descripcion'",
                });
            }
            updates.descripcion = descripcion;
        }

        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                return res.status(400).json({
                    message: "Tipo de dato inválido para 'isDeleted'",
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
                message: "No se proporcionaron campos para actualizar",
            });
        }

        const values = Object.values(updates).concat(idNumber);
        
        const [result] = await pool.query(`UPDATE rol_personal SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'rol_personal no encontrado'
            });
        }

        const [rows] = await pool.query('SELECT * FROM rol_personal WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};
