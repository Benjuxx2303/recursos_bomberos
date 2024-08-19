import { pool } from "../db";

export const getClaves = async (req, res) =>{
    try {
        const [rows] = await pool.query('SELECT * FROM clave')
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

// por id
export const getClaveById = async (req, res) =>{
    try {
        const [rows] = await pool.query('SELECT * FROM clave WHERE id = ?', [req.params.id]);
        if(rows.length <= 0) return res.status(404).json({
            message: "clave no encontrada"
        })
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

// TODO: obtener claves por nombre. "getClaveByNombre" o "getClaveByName"

export const createClave = async(req, res) =>{
    const {codigo, descripcion} = req.body
    try {
        const[rows] = await pool.query("INSERT INTO clave(codigo, descripcion) VALUES(?, ?)", [codigo, descripcion]);
        res.send({
            id: rows.insertId,
            codigo,
            descripcion
        });
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

export const deleteClave = async(req, res)=>{
    try {
        const [result] = await pool.query("DELETE FROM clave WHERE id = ?", [req.params.id]);
        if(result.affectedRows <= 0) return res.status(404).json({
            message: "clave no encontrada"
        });
        res.sendStatus(204)
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

export const updateClave = async(req, res)=>{
    const {id} = req.params;
    const {codigo, descripcion} = req.body
    try {
        const [result] = await pool.query("UPDATE clave SET codigo = IFNULL(?, codigo), descripcion = IFNULL(?, descripcion) WHERE id = ?", [codigo, descripcion, id]);
        if(result.affectedRows === 0) return res.status(404).json({
            message: "clave no encontrada"
        });

        const [rows] = await pool.query('SELECT * FROM clave WHERE id = ?', [id]);
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}