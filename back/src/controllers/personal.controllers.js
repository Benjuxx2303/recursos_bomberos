import {pool} from "../db.js";

export const getPersonal = async(req, res) =>{
    try {
        const [rows] = await pool.query('SELECT * FROM personal');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
};

// personal por id
export const getPersonalbyID = async(req, res)=>{
    try {
        const [rows] = await pool.query('SELECT * FROM personal WHERE id = ?', [req.params.id]);
        if(rows.length <=0) return res.status(404).json({
            message: 'personal no encontrado'
        })
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

// TODO: validaciones en llaves foraneas: "rol_personal_id", "compania_id". Validaciones en fechas: "fec_nac". Valor por defecto en: "activo", "img_url", "obs".
export const createPersonal = async(req, res) =>{
    const {
        rol_personal_id,
        rut,
        nombre,
        apellido, 
        activo, 
        compania_id,
        fec_nac,
        img_url,
        obs
    }= req.body
    try{
        const [rows] = await pool.query('INSERT INTO personal (rol_personal_id, rut, nombre, apellido, activo, compania_id, fec_nac, img_url, obs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            rol_personal_id,
            rut,
            nombre,
            apellido, 
            activo, 
            compania_id,
            fec_nac,
            img_url,
            obs
        ])
        res.send({
            id: rows.insertId,
            rol_personal_id,
            rut,
            nombre,
            apellido, 
            activo, 
            compania_id,
            fec_nac,
            img_url,
            obs
        });
    } catch (error){
        return res.status(500).json({
            message: error
        })
    }
}

// dar de baja (NO DELETE)
// TODO: Comprobar que el codigo funcione
export const downPersonal = async(req, res) =>{
    const {id} = req.params;
    try{
        const [result] = await pool.query("UPDATE personal SET activo = 0 WHERE id = ?", [id]);
        if(result.affectedRows === 0) return res.status(404).json({
            message: 'personal no encontrado'
        });
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}

// TODO: aplicar todas las validaciones posibles
export const updatePersonal = async(req, res) =>{
    const {id} = req.params;
    const {
        rol_personal_id,
        rut,
        nombre,
        apellido, 
        activo, 
        compania_id,
        fec_nac,
        img_url,
        obs
    } = req.body;

    try {
        const [result] = await pool.query('UPDATE personal SET'+
            'rol_personal_id = IFNULL(?, rol_personal_id)'+
            'rut = IFNULL(?, rut)'+
            'nombre = IFNULL(?, nombre)'+
            'apellido = IFNULL(?, apellido)'+
            'activo = IFNULL(?, activo)'+
            'compania_id = IFNULL(?, compania_id)'+
            'fec_nac = IFNULL(?, fec_nac)'+
            'img_url = IFNULL(?, img_url)'+
            'obs = IFNULL(?, obs)'+
            'WHERE id = ?', [
                rol_personal_id,
                rut,
                nombre,
                apellido, 
                activo, 
                compania_id,
                fec_nac,
                img_url,
                obs,
                id
            ])
        if(result.affectedRows === 0) return res.status(404).json({
            message: 'personal no encontrado'
        });

        const [rows] = await pool.query('SELECT * FROM personal WHERE id = ?', [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
}