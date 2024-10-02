import { pool } from "../db.js";

// TODO: Validación de ruts

// Devuelve todos los personales
export const getPersonal = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM personal WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: error.message
        });
    }
};

// Devuelve solamente los activos con detalles
export const getPersonalWithDetails = async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.rut, p.nombre AS nombre, p.apellido, p.fec_nac, p.img_url, p.obs, p.isDeleted,
                   rp.nombre AS rol_personal, 
                   c.nombre AS compania
            FROM personal p
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            WHERE p.isDeleted = 0
        `;
        
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: error.message
        });
    }
};

// Personal por id
export const getPersonalbyID = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido",
            });
        }
        
        const [rows] = await pool.query('SELECT * FROM personal WHERE id = ? AND isDeleted = 0', [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: 'Personal no encontrado'
            });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: error.message
        });
    }
}

export const createPersonal = async (req, res) => {
    const {
        rol_personal_id,
        rut,
        nombre,
        apellido,
        compania_id,
        fec_nac,
        img_url = '',
        obs = ''
    } = req.body;

    try {
        const rolPersonalIdNumber = parseInt(rol_personal_id);
        const companiaIdNumber = parseInt(compania_id);

        if (
            isNaN(rolPersonalIdNumber) ||
            isNaN(companiaIdNumber) ||
            typeof rut !== 'string' ||
            typeof nombre !== 'string' ||
            typeof apellido !== 'string' ||
            typeof fec_nac !== 'string'
        ) {
            return res.status(400).json({
                message: 'Tipo de datos inválido'
            });
        }

        // Validación de fecha
        const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
        if (!fechaRegex.test(fec_nac)) {
            return res.status(400).json({
                message: 'El formato de la fecha es inválido. Debe ser dd-mm-aaaa'
            });
        }

        // Inserción en la base de datos
        const [rows] = await pool.query(
            'INSERT INTO personal (rol_personal_id, rut, nombre, apellido, compania_id, fec_nac, img_url, obs, isDeleted) VALUES (?, ?, ?, ?, ?, STR_TO_DATE(?, "%d-%m-%Y"), ?, ?, 0)',
            [
                rolPersonalIdNumber,
                rut,
                nombre,
                apellido,
                companiaIdNumber,
                fec_nac,
                img_url,
                obs
            ]
        );

        return res.status(201).json({
            id: rows.insertId,
            rol_personal_id: rolPersonalIdNumber,
            rut,
            nombre,
            apellido,
            compania_id: companiaIdNumber,
            fec_nac,
            img_url,
            obs
        });
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

// Dar de baja
export const downPersonal = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query("UPDATE personal SET isDeleted = 1 WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Personal no encontrado'
            });
        }
        
        res.status(204).end();
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
}

export const updatePersonal = async (req, res) => {
    const { id } = req.params;
    const {
        rol_personal_id,
        rut,
        nombre,
        apellido,
        compania_id,
        fec_nac,
        img_url,
        obs,
        isDeleted
    } = req.body;

    try {
        const idNumber = parseInt(id);
        const rolPersonalIdNumber = parseInt(rol_personal_id);
        const companiaIdNumber = parseInt(compania_id);

        if (
            isNaN(rolPersonalIdNumber) ||
            isNaN(companiaIdNumber) ||
            typeof rut !== 'string' ||
            typeof nombre !== 'string' ||
            typeof apellido !== 'string' ||
            typeof fec_nac !== 'string'
        ) {
            return res.status(400).json({
                message: 'Tipo de datos inválido'
            });
        }

        // Validación de fecha
        const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
        if (!fechaRegex.test(fec_nac)) {
            return res.status(400).json({
                message: 'El formato de la fecha es inválido. Debe ser dd-mm-aaaa'
            });
        }

        const [result] = await pool.query('UPDATE personal SET ' +
            'rol_personal_id = IFNULL(?, rol_personal_id), ' +
            'rut = IFNULL(?, rut), ' +
            'nombre = IFNULL(?, nombre), ' +
            'apellido = IFNULL(?, apellido), ' +
            'compania_id = IFNULL(?, compania_id), ' +
            'fec_nac = IFNULL(?, fec_nac), ' +
            'img_url = IFNULL(?, img_url), ' +
            'obs = IFNULL(?, obs), ' +
            'isDeleted = IFNULL(?, isDeleted) ' +
            'WHERE id = ?', [
                rolPersonalIdNumber,
                rut,
                nombre,
                apellido,
                companiaIdNumber,
                fec_nac,
                img_url,
                obs,
                isDeleted,
                idNumber
            ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Personal no encontrado'
            });
        }

        const [rows] = await pool.query('SELECT * FROM personal WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};
