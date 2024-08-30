import { pool } from "../db.js";

export const getTiposMaquinas = async(req ,res) =>{
    try {
        const [rows] = await pool.query("SELECT * FROM tipo_maquina");
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

// busqueda por id
export const getTipoMaquinaById = async(req, res) =>{
    try {
        const[rows] = await pool.query("SELECT * FROM tipo_maquina WHERE id =?", [req.params.id]);
        if(rows.length <= 0) return res.status(404).json({
            message: "tipo de maquina no encontrado"
        })
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

export const createTipoMaquina = async(req, res) =>{
    const {nombre} = req.body
    try {
        const [rows] = await pool.query("INSERT INTO tipo_maquina(nombre) VALUES(?)", [nombre]);
        res.send({
            id: rows.insertId,
            nombre: nombre
        });
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

export const deleteTipoMaquina = async(req, res) =>{
    try {
        const[result] = await pool.query("DELETE FROM tipo_maquina WHERE id = ?", [req.params.id]);
        if(result.affectedRows <= 0) return res.status(404).json({
            message: "tipo_maquina no encontrado"
        });
        res.status(204);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
}

export const updateTipoMaquina = async(req, res) =>{
    const {id} = req.params;
    const {nombre} = req.body;
    try {
        const [result] = await pool.query('UPDATE tipo_maquina SET nombre = IFNULL(?, nombre) WHERE id = ?', [nombre, id]);
        if(result.affectedRows === 0) return res.status(404).json({
            message: "tipo_maquina no encontrado"
        });

        const [rows] = await pool.query("SELECT * FROM tipo_maquina WHERE id = ?", [id]);
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
}