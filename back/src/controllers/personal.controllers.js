import { pool } from "../db.js";
import {
    handleError,
    updateImageUrlInDb,
    saveImageUrlToDb,
    uploadFileToS3
} from '../utils/fileUpload.js';
import { validateRUT, validateDate } from '../utils/validations.js';

// TODO: implementacion de "imgLicencia"

// Devuelve todos los personales
export const getPersonal = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM personal WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Devuelve solamente los activos con detalles
export const getPersonalWithDetails = async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.rut, p.nombre AS nombre, p.apellido, 
                   DATE_FORMAT(p.fec_nac, '%d-%m-%Y') AS fec_nac,
                   DATE_FORMAT(p.fec_ingreso, '%d-%m-%Y') AS fec_ingreso,
                   p.img_url, 
                   p.obs, 
                   p.ven_licencia,
                   p.imgLicencia,
                   p.isDeleted,
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
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

export const getPersonalWithDetailsPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        // Nuevos filtros opcionales
        const { compania_id, maquina_id, rol_personal_id, nombre } = req.query;

        // Inicializar la consulta y los parámetros
        let query = `
            SELECT p.id, p.rut, p.nombre AS nombre, p.apellido,
                   DATE_FORMAT(p.fec_nac, '%d-%m-%Y') AS fec_nac,
                   DATE_FORMAT(p.fec_ingreso, '%d-%m-%Y') AS fec_ingreso,
                   p.img_url, p.obs, p.isDeleted,
                   rp.nombre AS rol_personal,
                   c.nombre AS compania,
                   p.compania_id, p.rol_personal_id, p.ven_licencia, p.imgLicencia, p.ultima_fec_servicio,
                   TIMESTAMPDIFF(MONTH, p.fec_ingreso, CURDATE()) AS antiguedad,
                   GROUP_CONCAT(DISTINCT m.id) AS maquinas_ids
            FROM personal p
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            LEFT JOIN conductor_maquina cm ON p.id = cm.personal_id
            LEFT JOIN maquina m ON cm.maquina_id = m.id
            WHERE p.isDeleted = 0
        `;

        const params = [];

        // Agregar filtros si se proporcionan
        if (compania_id) {
            query += ' AND p.compania_id = ?';
            params.push(compania_id);
        }

        if (rol_personal_id) {
            query += ' AND p.rol_personal_id = ?';
            params.push(rol_personal_id);
        }

        if (nombre) {
            query += ' AND p.nombre LIKE ?';
            params.push(`%${nombre}%`);
        }

        if (maquina_id) {
            query += ' AND m.id = ?';
            params.push(maquina_id);
        }

        query += ' GROUP BY p.id';

        // Si se proporciona "page", aplicar paginación
        if (req.query.page) {
            const offset = (page - 1) * pageSize;
            query += ' LIMIT ? OFFSET ?';
            params.push(pageSize, offset);
        }

        const [rows] = await pool.query(query, params);

        // Procesar los resultados
        const results = rows.map(row => {
            const maquinas = row.maquinas_ids ? row.maquinas_ids.split(',').map(id => parseInt(id)) : undefined;
            delete row.maquinas_ids;
            return maquinas ? { ...row, maquinas } : row;
        });

        res.json(results);
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
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

        const query = `
            SELECT p.id, p.rut, p.nombre AS nombre, p.apellido, 
                   DATE_FORMAT(p.fec_nac, '%d-%m-%Y') AS fec_nac,
                   DATE_FORMAT(p.fec_ingreso, '%d-%m-%Y') AS fec_ingreso,
                   p.img_url, 
                   p.obs, 
                   p.isDeleted,
                   rp.nombre AS rol_personal, 
                   c.nombre AS compania,
                   p.compania_id, p.rol_personal_id, p.ven_licencia, p.imgLicencia, p.ultima_fec_servicio,
                   TIMESTAMPDIFF(MONTH, p.fec_ingreso, CURDATE()) AS antiguedad,
                   GROUP_CONCAT(DISTINCT m.id) AS maquinas_ids
            FROM personal p
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            LEFT JOIN conductor_maquina cm ON p.id = cm.personal_id
            LEFT JOIN maquina m ON cm.maquina_id = m.id
            WHERE p.id = ? AND p.isDeleted = 0
            GROUP BY p.id
        `;
        
        const [rows] = await pool.query(query, [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: 'Personal no encontrado'
            });
        }

        const row = rows[0];
        const maquinas = row.maquinas_ids ? row.maquinas_ids.split(',').map(id => parseInt(id)) : undefined;
        delete row.maquinas_ids;

        const result = maquinas ? { ...row, maquinas } : row;

        res.json(result);
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};


export const createPersonal = async (req, res) => {
    let {
        rol_personal_id, // foranea
        rut,
        nombre,
        apellido,
        compania_id, // foranea
        fec_nac,
        obs = '',
        fec_ingreso,
        ven_licencia, // campo opcional
        ultima_fec_servicio_fecha, // campo opcional (DATETIME) FECHA
        ultima_fec_servicio_hora, // campo opcional (DATETIME) HORA
    } = req.body;

    const errors = []; // Array para almacenar los errores

    try {
        // Manejar la carga de archivos si existen
        let img_url = null;
        let imgLicenciaUrl = null;

        // Subir archivos a S3
        if (req.files) {
            const imagen = req.files.imagen ? req.files.imagen[0] : null;
            const imgLicencia = req.files.imgLicencia ? req.files.imgLicencia[0] : null;

            if (imagen) {
                try {
                    const imgData = await uploadFileToS3(imagen, 'personal');
                    if (imgData && imgData.Location) {
                        img_url = imgData.Location;
                    } else {
                        errors.push('No se pudo obtener la URL de la imagen de perfil');
                    }
                } catch (error) {
                    errors.push('Error al subir la imagen de perfil: ' + error.message);
                }
            }
        
            if (imgLicencia) {
                try {
                    const licenciaData = await uploadFileToS3(imgLicencia, 'personal');
                    if (licenciaData && licenciaData.Location) {
                        imgLicencia = licenciaData.Location;
                    } else {
                        errors.push('No se pudo obtener la URL de la imagen de la licencia');
                    }
                } catch (error) {
                    errors.push('Error al subir la imagen de la licencia: ' + error.message);
                }
            }
        }

        // Validación de datos
        const rolPersonalIdNumber = parseInt(rol_personal_id);
        const companiaIdNumber = parseInt(compania_id);
        rut = String(rut).trim();
        nombre = String(nombre).trim();
        apellido = String(apellido).trim();

        // declarar variable para almacenar la fecha y hora
        let ultima_fec_servicio = null;
        
        if (ultima_fec_servicio_fecha && ultima_fec_servicio_hora) {
            
            // Validar que ambos campos sean strings
            if (typeof ultima_fec_servicio_fecha !== 'string' || typeof ultima_fec_servicio_hora !== 'string') {
                errors.push('Tipo de datos inválido para ultima_fec_servicio');
            }

            // Validar que ambos campos tengan el formato correcto
            if (!validateDate(ultima_fec_servicio_fecha, ultima_fec_servicio_hora)) {
                errors.push('El formato de la fecha y hora de "ultima_fec_servicio" es inválido (dd-MM-yyyy HH:mm)');
            }

            ultima_fec_servicio = `${ultima_fec_servicio_fecha} ${ultima_fec_servicio_hora}`;
        }

        // Validación de tipo de datos
        if (
            isNaN(rolPersonalIdNumber) ||
            isNaN(companiaIdNumber) ||
            typeof rut !== 'string' ||
            typeof nombre !== 'string' ||
            typeof apellido !== 'string' ||
            typeof fec_nac !== 'string'
        ) {
            errors.push('Tipo de datos inválido');
        }

        // Validación de unicidad del rut
        const [rutExists] = await pool.query("SELECT 1 FROM personal WHERE rut = ? AND isDeleted = 0", [rut]);
        if (rutExists.length > 0) {
            errors.push('El RUT ya está registrado en el sistema.');
        }

        // Validación de longitud de campos
        if (rut.length > 12) {
            errors.push('El RUT no puede tener más de 12 caracteres');
        }

        if (!validateRUT(rut)) {
            errors.push('El RUT ingresado no es válido');
        }

        if (nombre.length > 50) {
            errors.push('El nombre no puede tener más de 50 caracteres');
        }

        if (apellido.length > 50) {
            errors.push('El apellido no puede tener más de 50 caracteres');
        }

        // Validación de existencia de llaves foráneas
        const [rolPersonalExists] = await pool.query("SELECT 1 FROM rol_personal WHERE id = ? AND isDeleted = 0", [rolPersonalIdNumber]);
        if (rolPersonalExists.length === 0) {
            errors.push("rol_personal no existe o está eliminado");
        }

        const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [companiaIdNumber]);
        if (companiaExists.length === 0) {
            errors.push("compañia no existe o está eliminada");
        }

        // Validación de fecha
        const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
        if (!fechaRegex.test(fec_nac)) {
            errors.push('El formato de la fecha de nacimiento es inválido. Debe ser dd-mm-aaaa');
        }

        // Validación opcional de fec_ingreso
        if (fec_ingreso) {
            if (typeof fec_ingreso !== 'string' || !fechaRegex.test(fec_ingreso)) {
                errors.push('El formato de la fecha de ingreso es inválido. Debe ser dd-mm-aaaa');
            }
        }

        // validacion opcional de ven_licencia (date)
        if (ven_licencia) {
            if (typeof ven_licencia !== 'string' || !fechaRegex.test(ven_licencia)) {
                errors.push('El formato de la fecha de vencimiento de licencia es inválido. Debe ser dd-mm-aaaa');
            }
        }

        // Si existen errores, devolverlos antes de continuar
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Inserción en la base de datos
        const [rows] = await pool.query(
            'INSERT INTO personal (rol_personal_id, rut, nombre, apellido, compania_id, fec_nac, img_url, obs, fec_ingreso, isDeleted, ven_licencia, imgLicencia, ultima_fec_servicio) VALUES (?, ?, ?, ?, ?, STR_TO_DATE(?, "%d-%m-%Y"), ?, ?, STR_TO_DATE(?, "%d-%m-%Y"), 0, STR_TO_DATE(?, "%d-%m-%Y"), ?, STR_TO_DATE(?, "%d-%m-%Y %H:%i"))',
            [
                rolPersonalIdNumber,
                rut,
                nombre,
                apellido,
                companiaIdNumber,
                fec_nac,
                img_url || null, // Inserta NULL si img_url no se especifica
                obs,
                fec_ingreso || null, // Inserta NULL si fec_ingreso no se especifica
                ven_licencia || null, // Inserta NULL si ven_licencia no se especifica
                imgLicenciaUrl || null, // Inserta NULL si imgLicenciaUrl no se especifica
                ultima_fec_servicio
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
            obs,
            fec_ingreso,
            ven_licencia,
            imgLicenciaUrl,
            ultima_fec_servicio
        });
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
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
    let {
        rol_personal_id, // foranea
        rut,
        nombre,
        apellido,
        compania_id, // foranea
        fec_nac,
        obs,
        isDeleted,
        fec_ingreso,
        ven_licencia, // campo opcional 
        ultima_fec_servicio_fecha, // campo opcional (DATETIME) FECHA
        ultima_fec_servicio_hora, // campo opcional (DATETIME) HORA     
    } = req.body;

    let errors = [];

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        // Validaciones
        const updates = {};
        if (rol_personal_id !== undefined) {
            const rolPersonalIdNumber = parseInt(rol_personal_id);
            if (isNaN(rolPersonalIdNumber)) {
                errors.push("Tipo de dato inválido para 'rol_personal_id'");
            }

            const [rolPersonalExists] = await pool.query("SELECT 1 FROM rol_personal WHERE id = ? AND isDeleted = 0", [rolPersonalIdNumber]);
            if (rolPersonalExists.length === 0) {
                errors.push("rol_personal no existe o está eliminado");
            }

            updates.rol_personal_id = rolPersonalIdNumber;

        }

        if (rut !== undefined) {
            rut = String(rut).trim();
            if (typeof rut !== 'string') {
                errors.push("Tipo de dato inválido para 'rut'");
            }

            if(!validateRUT(rut)){
                errors.push('El RUT ingresado no es válido');
            }

            const [rutExists] = await pool.query("SELECT 1 FROM personal WHERE rut = ? AND isDeleted = 0", [rut]);
            if (rutExists.length > 0) {
                errors.push('El RUT ya está registrado en el sistema.');
            }

            updates.rut = rut;
        }

        if (nombre !== undefined) {
            nombre = String(nombre).trim();
            if (typeof nombre !== 'string') {
                errors.push("Tipo de dato inválido para 'nombre'");
            }
            updates.nombre = nombre;
        }

        if (apellido !== undefined) {
            apellido = String(apellido).trim();
            if (typeof apellido !== 'string') {
                errors.push("Tipo de dato inválido para 'apellido'");
            }
            updates.apellido = apellido;
        }

        if (compania_id !== undefined) {
            const companiaIdNumber = parseInt(compania_id);
            if (isNaN(companiaIdNumber)) {
                errors.push("Tipo de dato inválido para 'compania_id'");
            }
            
            const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [companiaIdNumber]);
            if (companiaExists.length === 0) {
                errors.push("compañia no existe o está eliminada");
            }
            
            updates.compania_id = companiaIdNumber;
        }

        // TODO: Usar "validateDate" para validar las fechas
        if (fec_nac !== undefined) {
            if (typeof fec_nac !== 'string') {
                errors.push("Tipo de dato inválido para 'fec_nac'");
            }

            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            if (!fechaRegex.test(fec_nac)) {
                errors.push('El formato de la fecha es inválido. Debe ser dd-mm-aaaa');
            }
            updates.fec_nac = fec_nac;
        }

        if (fec_ingreso !== undefined) {
            if (typeof fec_ingreso !== 'string') {
                errors.push("Tipo de dato inválido para 'fec_ingreso'");
            }

            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            if (!fechaRegex.test(fec_ingreso)) {
                errors.push('El formato de la fecha de ingreso es inválido. Debe ser dd-mm-aaaa');
            }
            updates.fec_ingreso = fec_ingreso;
        }

        if (ven_licencia !== undefined) {
            if (typeof ven_licencia !== 'string') {
                errors.push("Tipo de dato inválido para 'ven_licencia'");
            }

            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            if (!fechaRegex.test(ven_licencia)) {
                errors.push('El formato de la fecha de vencimiento de licencia es inválido. Debe ser dd-mm-aaaa');
            }
            updates.ven_licencia = ven_licencia;
        }

        // manejar la carga de archivos si existen
        if (req.files) {
            const imagen = req.files.imagen ? req.files.imagen[0] : null;
            const imgLicencia = req.files.imgLicencia ? req.files.imgLicencia[0] : null;

        
            if (imagen) {
                try {
                    const imgData = await uploadFileToS3(imagen, 'personal');
                    if (imgData && imgData.Location) {
                        updates.img_url = imgData.Location;
                    } else {
                        errors.push('No se pudo obtener la URL de la imagen de perfil');
                    }
                } catch (error) {
                    errors.push('Error al subir la imagen de perfil: ' + error.message);
                }
            }
        
            if (imgLicencia) {
                try {
                    const licenciaData = await uploadFileToS3(imgLicencia, 'personal');
                    if (licenciaData && licenciaData.Location) {
                        updates.imgLicencia = licenciaData.Location;
                    } else {
                        errors.push('No se pudo obtener la URL de la imagen de la licencia');
                    }
                } catch (error) {
                    errors.push('Error al subir la imagen de la licencia: ' + error.message);
                }
            }
        }
        

        if (obs !== undefined) {
            if (typeof obs !== 'string') {
                errors.push("Tipo de dato inválido para 'obs'");
            }
            updates.obs = obs;
        }

        if (isDeleted !== undefined) {
            if (typeof isDeleted !== 'number' || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            }
            updates.isDeleted = isDeleted;
        }

        if (ultima_fec_servicio_fecha !== undefined && ultima_fec_servicio_hora !== undefined) {
            // Validar que ambos campos sean strings
            if (typeof ultima_fec_servicio_fecha !== 'string' || typeof ultima_fec_servicio_hora !== 'string') {
                errors.push('Tipo de datos inválido para ultima_fec_servicio');
            }

            // Validar que ambos campos tengan el formato correcto
            if (!validateDate(ultima_fec_servicio_fecha) || !validateDate(ultima_fec_servicio_hora)) {
                errors.push('El formato de la fecha y hora de "ultima_fec_servicio" es inválido (dd-MM-yyyy HH:mm)');
            }

            updates.ultima_fec_servicio = `${ultima_fec_servicio_fecha} ${ultima_fec_servicio_hora}`;
        }

        console.log("Updates:", updates);
        console.log("Files: ", req.files)

        if (errors.length > 0) {
            return res.status(400).json({ errors }); // Devuelve los errores
        }

        const setClause = Object.keys(updates)
            .map((key) => {
                if (key === 'fec_nac' || key === 'fec_ingreso' || key === 'ven_licencia') {
                    // Para estos campos, usa STR_TO_DATE con el formato de fecha sin hora
                    return `${key} = STR_TO_DATE(?, '%d-%m-%Y')`;
                }
                if (key === 'ultima_fec_servicio') {
                    // Para el campo 'ultima_fec_servicio', usa STR_TO_DATE con el formato de fecha y hora
                    return `${key} = STR_TO_DATE(?, '%d-%m-%Y %H:%i')`;
                }
                // Para otros campos, usa el valor directo
                return `${key} = ?`;
            })
            .join(', ');



        const values = Object.values(updates).concat(idNumber);
        const [result] = await pool.query(`UPDATE personal SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Personal no encontrado'
            });
        }

        const [rows] = await pool.query('SELECT * FROM personal WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const fetchConductoresByCompania = async (req, res) => {
    try {
        const { compania_id, maquina_id } = req.query;

        let query = `
            SELECT 
                p.id AS personal_id,
                p.nombre,
                p.apellido,
                p.rut,
                p.compania_id,
                c.nombre AS compania,
                rp.nombre AS rol_personal,
                GROUP_CONCAT(DISTINCT m.id) AS maquinas_ids
            FROM personal p
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            LEFT JOIN conductor_maquina cm ON p.id = cm.personal_id
            LEFT JOIN maquina m ON cm.maquina_id = m.id
            WHERE p.isDeleted = 0 AND rp.nombre = 'Conductor'
        `;

        const params = [];

        if (compania_id) {
            query += ' AND p.compania_id = ?';
            params.push(compania_id);
        }

        if (maquina_id) {
            query += ' AND m.id = ?';
            params.push(maquina_id);
        }

        query += ' GROUP BY p.id';

        const [rows] = await pool.query(query, params);

        // Transformar los IDs de máquinas en un arreglo
        const result = rows.map(row => ({
            ...row,
            maquinas_ids: row.maquinas_ids ? row.maquinas_ids.split(',').map(id => parseInt(id)) : []
        }));

        res.json(result);
    } catch (error) {
        console.error('error: ', error);
        res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};