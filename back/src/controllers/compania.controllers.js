import {pool} from "../db.js";

export const getCompanias = async(req, res)=>{
    try {
        const [rows] = await pool.query('SELECT * FROM compania WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
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
            message: error
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
            message: error.message
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
            message: error
        })
    }
}

export const updateCompania = async(req, res) =>{
    const {id} = req.params;
    const {nombre, isDeleted} = req.body;

    try {
        const idNumber = parseInt(id);
        if (
          isNaN(idNumber) ||
          typeof nombre !== "string" ||
          typeof isDeleted !== "number" ||
          (isDeleted !== 0 && isDeleted !== 1)
        ) {
          res.status(400).json({
            message: "Tipo de datos inválido"
          });
        }

        const [result] = await pool.query('UPDATE compania SET nombre = IFNULL(?, nombre) isDeleted = IFNULL(?, isDeleted) WHERE id = ?', [nombre, isDeleted, idNumber])
        if(result.affectedRows === 0) return res.status(404).json({
            message: 'compania no encontrada'
        });

        const [rows] = await pool.query('SELECT * FROM compania WHERE id = ?', [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}