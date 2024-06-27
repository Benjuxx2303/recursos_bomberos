import {pool} from "../db.js";

export const getCompanias = async(req, res)=>{
    try {
        const [rows] = await pool.query('SELECT * FROM compania');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
};

// compañia por id
export const getCompania = async(req, res)=>{
    try {
        const [rows] = await pool.query('SELECT * FROM compania WHERE id = ?', [req.params.id]);
        if(rows.length <=0) return res.status(404).json({
            message: 'compania no encontrado'
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
        const [rows] = await pool.query('INSERT INTO compania (nombre) VALUES (?)', [nombre])
        res.send({
            id: rows.insertId,
            nombre,
            desc
        });
    } catch (error){
        return res.status(500).json({
            message: error
        })
    }
}

// eliminar compañia por id
export const deleteCompania = async(req, res) =>{
    try {
        const [result] = await pool.query('DELETE FROM compania WHERE id = ?', [req.params.id]);
        if (result.affectedRows <= 0) return res.status(404).json({
            message: 'compania no encontrado'
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
    const {nombre} = req.body;

    try {
        const [result] = await pool.query('UPDATE compania SET nombre = IFNULL(?, nombre) WHERE id = ?', [nombre])
        if(result.affectedRows === 0) return res.status(404).json({
            message: 'compania no encontrado'
        });

        const [rows] = await pool.query('SELECT * FROM compania WHERE id = ?', [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}