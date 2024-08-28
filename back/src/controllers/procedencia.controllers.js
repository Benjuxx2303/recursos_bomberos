import { pool } from "../db";

export const getProcedencias = async(req, res) =>{
    try {
        const [rows] = await pool.query('SELECT * FROM procedencia');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

export const getProcedenciaById = async(req, res)=>{
    try {
        const [rows] = await pool.query('SELECT * FROM procedencia WHERE id = ?', [req.params.id]);
        if(rows.length <= 0) return res.status(404).json({
            message: "procedencia no encontrada"
        })
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

// TODO: crear rutas para distintas columnas. usar de preferencia el metodo LIKE en SQL.

export const createProcedencia = async(req, res)=>{
    const {nombre} = req.body
    try {
        const [rows] = await pool.query("INSERT INTO procedencia(nombre) VALUES(?)", [nombre]);
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

export const deleteProcedencia = async(req, res) =>{
    try {
        const[result] = await pool.query("DELETE FROM procedencia WHERE id = ?", [req.params.id]);
        if(result.affectedRows <= 0) return res.status(404).json({
            message: "procedencia no encontrada"
        });
        res.status(204);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
}

export const updateProcedencia = async(req, res)=>{
    const {id} = req.params;
    const {nombre} = req.body;
    try {
        const [result] = await pool.query('UPDATE procedencia SET nombre = IFNULL(?, nombre) WHERE id = ?', [nombre, id]);
        if(result.affectedRows === 0) return res.status(404).json({
            message: "procedencia no encontrada"
        });

        const [rows] = await pool.query("SELECT * FROM procedencia WHERE id = ?", [id]);
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
}