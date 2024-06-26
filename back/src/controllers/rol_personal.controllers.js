import {pool} from "../db.js";

export const getRolesPersonal = async(req, res)=>{
    try {
        const [rows] = await pool.query('SELECT * FROM rol_personal');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
};

// obtener por id de rol
export const getRolPersonal = async(req, res)=>{
    try {
        const [rows] = await pool.query('SELECT * FROM rol_personal WHERE id = ?', [req.params.id]);
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
    const {nombre, desc} = req.body
    try{
        const [rows] = await pool.query('INSERT INTO rol_personal (nombre, desc) VALUES (?, ?)', [nombre, desc])
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

export const deleteRolPersonal = async(req, res) =>{
    try {
        const [result] = await pool.query('DELETE FROM rol_personal WHERE id = ?', [req.params.id]);
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

export const updateRolPersonal = async(req, res) =>{
    const {id} = req.params;
    const {nombre, desc} = req.body;

    try {
        const [result] = await pool.query('UPDATE rol_personal SET nombre = IFNULL(?, nombre), desc = IFNULL(?, desc) WHERE id = ?', [nombre, desc, id])
        if(result.affectedRows === 0) return res.status(404).json({
            message: 'rol_personal no encontrado'
        });

        const [rows] = await pool.query('SELECT * FROM rol_personal WHERE id = ?', [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}