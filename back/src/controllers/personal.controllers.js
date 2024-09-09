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

// devuelve solamente los activos
export const getPersonalWithDetails = async(req, res) => {
    try {
        const query = `
            SELECT p.id, p.rut, p.nombre AS personal_nombre, p.apellido, p.activo, 
                   p.fec_nac, p.img_url, p.obs, 
                   rp.nombre AS rol_nombre, 
                   c.nombre AS compania_nombre
            FROM personal p
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            WHERE p.activo = 1
        `;
        
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
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

// TODO: Validaciones en formatos de fechas: "fec_nac".
export const createPersonal = async(req, res) =>{
    const {
        rol_personal_id,
        rut,
        nombre,
        apellido, 
        activo = 1, // activo por defecto. "1"  
        compania_id,
        fec_nac,
        img_url = '', // sin imagen por defecto 
        obs = '' // sin observaciones por defecto
    }= req.body

    if (!rol_personal_id || !rut || !nombre || !apellido || !compania_id || !fec_nac) {
        return res.status(400).json({
            message: 'Todos los campos requeridos deben estar presentes'
        });
    }

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