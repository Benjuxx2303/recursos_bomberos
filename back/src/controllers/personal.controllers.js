import { pool } from "../db.js";
import { convertDateFormat } from '../utils/dateUtils.js';
import {
    uploadFileToS3
} from '../utils/fileUpload.js';
import { validateDate, validateRUT } from '../utils/validations.js';

export const getPersonalWithDetailsPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        // Nuevos filtros opcionales
        const { compania_id, maquina_id, rol_personal_id, nombre, disponible, rut, esConductor, isDeleted, search } = req.query;

        // Aplicar filtro de compañía desde el middleware si existe y no hay un compania_id específico
        let companiaIdFilter = compania_id;
        if (req.companyFilter && !compania_id) {
            companiaIdFilter = req.companyFilter;
        }

        // Inicializar la consulta y los parámetros
        let query = `
            SELECT p.id, p.disponible, p.rut, p.nombre AS nombre, p.apellido,
                   DATE_FORMAT(p.fec_nac, '%d-%m-%Y') AS fec_nac,
                   DATE_FORMAT(p.fec_ingreso, '%d-%m-%Y') AS fec_ingreso,
                   p.img_url, p.obs, p.isDeleted,
                   p.minutosConducidos,
                   rp.nombre AS rol_personal,
                   c.nombre AS compania,
                   p.compania_id, p.rol_personal_id, DATE_FORMAT(p.ven_licencia, '%d-%m-%Y') AS ven_licencia, p.imgLicencia, 
                   DATE_FORMAT(p.ultima_fec_servicio, '%d-%m-%Y %H:%i') AS ultima_fec_servicio,
                   TIMESTAMPDIFF(HOUR, p.ultima_fec_servicio, NOW()) AS horas_desde_ultimo_servicio,
                   TIMESTAMPDIFF(MONTH, p.fec_ingreso, CURDATE()) AS antiguedad,
                   GROUP_CONCAT(DISTINCT m.id) AS maquinas_ids,
                   (SELECT CAST(SUM(TIMESTAMPDIFF(HOUR, fh_salida, fh_llegada)) AS UNSIGNED)
                    FROM bitacora
                    WHERE bitacora.personal_id = p.id) AS total_horas_conduccion,
                   -- Estado maquinista calculado
                   CASE 
                       WHEN p.ven_licencia IS NULL THEN 'sin licencia'
                       WHEN (SELECT CAST(SUM(TIMESTAMPDIFF(HOUR, fh_salida, fh_llegada)) AS UNSIGNED)
                             FROM bitacora
                             WHERE bitacora.personal_id = p.id) < 40 OR 
                            (SELECT CAST(SUM(TIMESTAMPDIFF(HOUR, fh_salida, fh_llegada)) AS UNSIGNED)
                             FROM bitacora
                             WHERE bitacora.personal_id = p.id) IS NULL 
                            THEN 'en entrenamiento'
                       WHEN (SELECT CAST(SUM(TIMESTAMPDIFF(HOUR, fh_salida, fh_llegada)) AS UNSIGNED)
                             FROM bitacora
                             WHERE bitacora.personal_id = p.id) >= 40 AND 
                            p.ven_licencia >= CURDATE() THEN 'apto'
                       WHEN p.ven_licencia < CURDATE() THEN 'licencia vencida'
                       ELSE 'no apto'
                   END AS estado_maquinista
            FROM personal p
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            LEFT JOIN conductor_maquina cm ON p.id = cm.personal_id
            LEFT JOIN maquina m ON cm.maquina_id = m.id
            WHERE p.isDeleted = ?`;

        // Si no se proporciona 'isDeleted', se asigna 0 por defecto
        const params = [isDeleted !== undefined ? isDeleted : 0];
    
        // Agregar filtros si se proporcionan
        if (search) {
            query += ' AND (p.rut LIKE ? OR p.nombre LIKE ? OR p.apellido LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (req.companyFilter) {
            query += ' AND p.compania_id = ?';
            params.push(req.companyFilter);
        }
        if (companiaIdFilter) {
            query += ' AND p.compania_id = ?';
            params.push(companiaIdFilter);
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

        if (disponible !== undefined) {  // Si disponible es 0 o 1
            query += ' AND p.disponible = ?';
            params.push(disponible);
        }

        if (rut) {
            query += ' AND p.rut LIKE ?';
            params.push(`%${rut}%`);
        }
        if (esConductor !== undefined) {
            if (esConductor === 'true' || esConductor === 1 || esConductor === '1') {
                query += ' AND EXISTS (SELECT 1 FROM conductor_maquina WHERE conductor_maquina.personal_id = p.id)';
            } else {
                query += ' AND NOT EXISTS (SELECT 1 FROM conductor_maquina WHERE conductor_maquina.personal_id = p.id)';
            }
        }

        query += ' GROUP BY p.id ORDER BY p.id DESC';

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

export const getPersonalLowData = async (req, res) => {
    try {
        const { compania_id } = req.query;

        // Aplicar filtro de compañía desde el middleware si existe y no hay un compania_id específico
        let companiaIdFilter = compania_id;
        if (req.companyFilter && !compania_id) {
            companiaIdFilter = req.companyFilter;
        }

        let query = `
            SELECT p.id, p.rut, p.nombre, p.apellido, 
                   rp.nombre AS rol_personal, 
                   c.nombre AS compania, 
                   p.compania_id
            FROM personal p
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            WHERE p.isDeleted = 0
        `;

        const params = [];

        if (companiaIdFilter) {
            query += ' AND p.compania_id = ?';
            params.push(companiaIdFilter);
        }

        query += ' ORDER BY p.id DESC';

        const [rows] = await pool.query(query, params);

        res.json(rows);
    } catch (error) {
        console.error('Error: ', error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
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

        // Inicializar la consulta y parámetros
        let query = `
            SELECT p.id, p.disponible, p.rut, p.nombre AS nombre, p.apellido, p.correo, p.celular,
                   DATE_FORMAT(p.fec_nac, '%d-%m-%Y') AS fec_nac,
                   DATE_FORMAT(p.fec_ingreso, '%d-%m-%Y') AS fec_ingreso,
                   p.img_url, p.obs, p.isDeleted,
                   rp.nombre AS rol_personal, 
                   c.nombre AS compania,
                   p.compania_id, p.rol_personal_id, p.ven_licencia, p.imgLicencia, p.imgReversaLicencia,
                   p.minutosConducidos,
                   DATE_FORMAT(p.ultima_fec_servicio, '%d-%m-%Y %H:%i') AS ultima_fec_servicio,
                   TIMESTAMPDIFF(HOUR, p.ultima_fec_servicio, NOW()) AS horas_desde_ultimo_servicio,
                   TIMESTAMPDIFF(MONTH, p.fec_ingreso, CURDATE()) AS antiguedad,
                   GROUP_CONCAT(DISTINCT m.id) AS maquinas_ids,
                   u.username AS usuario,
                   u.id AS usuario_id,
                   (SELECT CAST(SUM(TIMESTAMPDIFF(HOUR, fh_salida, fh_llegada)) AS UNSIGNED)
                    FROM bitacora
                    WHERE bitacora.personal_id = p.id) AS total_horas_conduccion,
                   -- Estado maquinista calculado
                   CASE 
                       WHEN p.ven_licencia IS NULL THEN 'sin licencia'
                       WHEN (SELECT CAST(SUM(TIMESTAMPDIFF(HOUR, fh_salida, fh_llegada)) AS UNSIGNED)
                             FROM bitacora
                             WHERE bitacora.personal_id = p.id) < 40 OR 
                            (SELECT CAST(SUM(TIMESTAMPDIFF(HOUR, fh_salida, fh_llegada)) AS UNSIGNED)
                             FROM bitacora
                             WHERE bitacora.personal_id = p.id) IS NULL 
                            THEN 'en entrenamiento'
                       WHEN (SELECT CAST(SUM(TIMESTAMPDIFF(HOUR, fh_salida, fh_llegada)) AS UNSIGNED)
                             FROM bitacora
                             WHERE bitacora.personal_id = p.id) >= 40 AND 
                            p.ven_licencia >= CURDATE() THEN 'apto'
                       WHEN p.ven_licencia < CURDATE() THEN 'licencia vencida'
                       ELSE 'no apto'
                   END AS estado_maquinista
            FROM personal p
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            LEFT JOIN conductor_maquina cm ON p.id = cm.personal_id
            LEFT JOIN maquina m ON cm.maquina_id = m.id
            LEFT JOIN usuario u ON p.id = u.personal_id AND u.isDeleted = 0
            WHERE p.id = ? AND p.isDeleted = 0
            GROUP BY p.id, u.username
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
        correo,
        celular,
    } = req.body;

    const errors = []; // Array para almacenar los errores

    try {
        // Manejar la carga de archivos si existen
        let img_url = null;
        let imgLicenciaUrl = null; // Cambiado de imgLicencia a imgLicenciaUrl para evitar conflictos

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
                        imgLicenciaUrl = licenciaData.Location; // Usando imgLicenciaUrl en lugar de imgLicencia
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
        rut = rut ? String(rut).trim() : '';
        nombre = String(nombre).trim();
        apellido = String(apellido).trim();
        
        // Solo procesar correo y celular si existen en req.body
        if ('correo' in req.body) {
            correo = String(correo).trim();
        } else {
            correo = null;
        }
        
        if ('celular' in req.body) {
            celular = String(celular).trim();
        } else {
            celular = null;
        }

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
            typeof apellido !== 'string' 
   
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
   //descative temporalmente esta validacio
 /*        if (!validateRUT(rut)) {
            errors.push('El RUT ingresado no es válido');
        } */

        if (nombre.length > 50) {
            errors.push('El nombre no puede tener más de 50 caracteres');
        }

        if (apellido.length > 50) {
            errors.push('El apellido no puede tener más de 50 caracteres');
        }

        // Validación de correo duplicado si se proporciona
        if (correo) {
            const [correoExists] = await pool.query(
                "SELECT 1 FROM personal WHERE correo = ? AND isDeleted = 0",
                [correo]
            );
            if (correoExists.length > 0 ) {
                errors.push('El correo electrónico ya está registrado en el sistema.');
            }
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
            /* errors.push('El formato de la fecha de nacimiento es inválido. Debe ser dd-mm-aaaa'); */
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

        // Convertir fechas al formato de la base de datos
        if (fec_nac) {
            const convertedDate = convertDateFormat(fec_nac, 'dd-MM-yyyy', 'yyyy-MM-dd');
            if (!convertedDate) {
                errors.push('Formato de fecha de nacimiento inválido');
            }
            fec_nac = convertedDate;
        }

        if (fec_ingreso) {
            const convertedDate = convertDateFormat(fec_ingreso, 'dd-MM-yyyy', 'yyyy-MM-dd');
            if (!convertedDate) {
                errors.push('Formato de fecha de ingreso inválido');
            }
            fec_ingreso = convertedDate;
        }

        if (ven_licencia) {
            const convertedDate = convertDateFormat(ven_licencia, 'dd-MM-yyyy', 'yyyy-MM-dd');
            if (!convertedDate) {
                errors.push('Formato de fecha de vencimiento de licencia inválido');
            }
            ven_licencia = convertedDate;
        }

        // Inserción en la base de datos
        const [rows] = await pool.query(
            `INSERT INTO personal (
                rol_personal_id, rut, nombre, apellido, compania_id, fec_nac, img_url, obs, 
                fec_ingreso, isDeleted, ven_licencia, imgLicencia, ultima_fec_servicio, correo, celular
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
            [
                rolPersonalIdNumber,
                rut,
                nombre,
                apellido,
                companiaIdNumber,
                fec_nac,
                img_url || null,
                obs,
                fec_ingreso,
                ven_licencia,
                imgLicenciaUrl,
                ultima_fec_servicio,
                correo,
                celular
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
            ultima_fec_servicio,
            correo,
            celular
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
        fec_ingreso,
        obs,
        isDeleted,
        ven_licencia, // campo opcional 
        ultima_fec_servicio_fecha, // campo opcional (DATETIME) FECHA
        ultima_fec_servicio_hora, // campo opcional (DATETIME) HORA     
        correo,
        celular,
        ven_licencia_fecha, // campo opcional (DATE) FECHA
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
            console.log('Intentando actualizar rol_personal_id:', rol_personal_id);
            const rolPersonalIdNumber = parseInt(rol_personal_id);
            if (isNaN(rolPersonalIdNumber)) {
                console.error('Error: rol_personal_id no es un número válido:', rol_personal_id);
                errors.push("Tipo de dato inválido para 'rol_personal_id'");
            }

            const [rolPersonalExists] = await pool.query("SELECT 1 FROM rol_personal WHERE id = ? AND isDeleted = 0", [rolPersonalIdNumber]);
            if (rolPersonalExists.length === 0) {
                console.error('Error: rol_personal no existe o está eliminado:', rolPersonalIdNumber);
                errors.push("rol_personal no existe o está eliminado");
            } else {
                console.log('Rol personal válido encontrado:', rolPersonalIdNumber);
                updates.rol_personal_id = rolPersonalIdNumber;
            }
        }
        if (correo !== undefined) {
            correo = String(correo).trim();
            if (typeof correo !== 'string') {
                errors.push("Tipo de dato inválido para 'correo'");
            } else {
                // Validar que el correo no esté en uso por otro personal
                const [correoExists] = await pool.query(
                    "SELECT 1 FROM personal WHERE correo = ? AND id != ? AND isDeleted = 0",
                    [correo, idNumber]
                );
                if (correoExists.length > 0) {
                    errors.push('El correo electrónico ya está registrado en el sistema.');
                } else {
                    updates.correo = correo;
                }
            }
        }
        if (celular !== undefined) {    
            celular = String(celular).trim();
            if (typeof celular !== 'string') {
                errors.push("Tipo de dato inválido para 'celular'");
            }
            updates.celular = celular;
        }

        if (rut !== undefined) {
            rut = String(rut).trim();
            if (typeof rut !== 'string') {
                errors.push("Tipo de dato inválido para 'rut'");
            }

            if(!validateRUT(rut)){
                errors.push('El RUT ingresado no es válido');
            }

            // Verificar si el RUT ya existe, excluyendo el registro actual
            const [rutExists] = await pool.query(
                "SELECT 1 FROM personal WHERE rut = ? AND id != ? AND isDeleted = 0",
                [rut, idNumber]
            );
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

        // Convertir fechas al formato de la base de datos
        if (fec_nac) {
            const convertedDate = convertDateFormat(fec_nac, 'dd-MM-yyyy', 'yyyy-MM-dd');
            if (!convertedDate) {
                errors.push('Formato de fecha de nacimiento inválido');
            }
            updates.fec_nac = convertedDate;
        }

        if (fec_ingreso) {
            const convertedDate = convertDateFormat(fec_ingreso, 'dd-MM-yyyy', 'yyyy-MM-dd');
            if (!convertedDate) {
                errors.push('Formato de fecha de ingreso inválido');
            }
            updates.fec_ingreso = convertedDate;
        }

        if (ven_licencia) {
            const convertedDate = convertDateFormat(ven_licencia, 'dd-MM-yyyy', 'yyyy-MM-dd');
            if (!convertedDate) {
                errors.push('Formato de fecha de vencimiento de licencia inválido');
            }
            updates.ven_licencia = convertedDate;
        }

        // manejar la carga de archivos si existen
        if (req.files) {
            const imagen = req.files.imagen ? req.files.imagen[0] : null;
            const imgLicencia = req.files.imgLicencia ? req.files.imgLicencia[0] : null;
            const imgReversaLicencia = req.files.imgReversaLicencia ? req.files.imgReversaLicencia[0] : null;

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

            if (imgReversaLicencia) {
                try {
                    const reversaLicenciaData = await uploadFileToS3(imgReversaLicencia, 'personal');
                    if (reversaLicenciaData && reversaLicenciaData.Location) {
                        updates.imgReversaLicencia = reversaLicenciaData.Location;
                    } else {
                        errors.push('No se pudo obtener la URL de la imagen reversa de la licencia');
                    }
                } catch (error) {
                    errors.push('Error al subir la imagen reversa de la licencia: ' + error.message);
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

        if (errors.length > 0) {
            return res.status(400).json({ errors }); // Devuelve los errores
        }

        // Iniciar transacción para actualizar ambas tablas
        await pool.query('START TRANSACTION');

        try {
            console.log('Objeto updates antes de construir la consulta:', JSON.stringify(updates, null, 2));
            
            if (Object.keys(updates).length === 0) {
                await pool.query('ROLLBACK');
                return res.status(400).json({ 
                    message: 'No se proporcionaron datos para actualizar',
                    receivedData: req.body,
                    files: req.files ? Object.keys(req.files) : 'No files'
                });
            }

            const setClause = Object.keys(updates)
                .map((key) => {
                    if (['fec_nac', 'fec_ingreso', 'ven_licencia'].includes(key)) {
                        return `${key} = ?`;
                    }
                    if (key === 'ultima_fec_servicio') {
                        return `${key} = STR_TO_DATE(?, '%Y-%m-%d %H:%i')`;
                    }
                    return `${key} = ?`;
                })
                .join(', ');

            const values = Object.values(updates).concat(idNumber);
            const [result] = await pool.query(`UPDATE personal SET ${setClause} WHERE id = ?`, values);

            if (result.affectedRows === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({
                    message: 'Personal no encontrado'
                });
            }

            // Si se actualizó el correo, actualizar también en la tabla usuario
            if (updates.correo) {
                await pool.query(
                    "UPDATE usuario SET correo = ? WHERE personal_id = ?",
                    [updates.correo, idNumber]
                );
            }

            await pool.query('COMMIT');

            const [rows] = await pool.query('SELECT * FROM personal WHERE id = ?', [idNumber]);
            res.json(rows[0]);
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
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

// Obtener personal eliminado (isDeleted = 1)
export const getDeletedPersonal = async (req, res) => {
    try {
        // Verificar estructura de la tabla personal
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'personal'
        `);
        
        // Verificar el tipo de dato de isDeleted
        const isDeletedColumn = columns.find(col => col.COLUMN_NAME === 'isDeleted');
        if (!isDeletedColumn) {
            return res.status(400).json({ 
                message: 'La columna isDeleted no existe en la tabla personal',
                columns: columns.map(c => ({ name: c.COLUMN_NAME, type: c.DATA_TYPE }))
            });
        }

        // Verificar registros con isDeleted = 1
        const [testResult] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM personal 
            WHERE isDeleted = 1
            ORDER BY id DESC
            LIMIT 1
        `);
        
        if (testResult.length === 0) {
            return res.status(200).json([]); // Retornar array vacío si no hay registros
        }

        // Si hay registros, intentar con la consulta completa
        const query = `
            SELECT 
                p.id,
                p.disponible,
                p.rol_personal_id,
                p.compania_id,
                p.nombre,
                p.apellido,
                p.rut,
                p.correo,
                p.celular,
                p.fec_nac,
                p.fec_ingreso,
                p.ultima_fec_servicio,
                p.obs,
                p.ven_licencia,
                p.imgLicencia,
                p.img_url,
                p.isDeleted,
                p.minutosConducidos,
                c.nombre AS compania_nombre,
                rp.nombre AS rol_nombre
            FROM personal p
            LEFT JOIN compania c ON p.compania_id = c.id
            LEFT JOIN rol_personal rp ON p.rol_personal_id = rp.id
            WHERE p.isDeleted = 1
            ORDER BY p.id DESC
        `;

        const [rows] = await pool.query(query);
        console.log('Consulta ejecutada:', query);
        console.log('Registros obtenidos:', rows.length);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener personal eliminado:', error);
        
        // Intentar obtener información más detallada del error
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(400).json({ 
                message: 'Error en la consulta: campo no encontrado',
                error: error.message
            });
        }
        
        res.status(500).json({ 
            message: 'Error interno al obtener personal eliminado',
            error: error.message
        });
    }
};

// Restaurar personal (isDeleted = 0)
export const restorePersonal = async (req, res) => {
    try {
        // Verificar que se recibió el ID
        const { id } = req.body;
        if (!id || typeof id !== 'number') {
            return res.status(400).json({ 
                message: 'ID inválido',
                error: 'El ID debe ser un número'
            });
        }

        // Verificar que el registro existe antes de actualizar
        const [personalExists] = await pool.query(
            'SELECT id FROM personal WHERE id = ? AND isDeleted = 1',
            [id]
        );

        if (personalExists.length === 0) {
            return res.status(404).json({ 
                message: 'No se puede restaurar el personal',
                error: 'El registro no existe o ya está activo'
            });
        }

        // Actualizar el registro
        const [result] = await pool.query(
            'UPDATE personal SET isDeleted = 0 WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'No se pudo restaurar el personal',
                error: 'No se actualizaron registros'
            });
        }

        res.status(200).json({ 
            message: 'Personal restaurado exitosamente',
            id: id
        });
    } catch (error) {
        console.error('Error al restaurar personal:', error);
        
        // Proporcionar mensajes de error más descriptivos
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(400).json({ 
                message: 'Error en la estructura de la base de datos',
                error: error.message
            });
        }
        
        res.status(500).json({ 
            message: 'Error interno al restaurar personal',
            error: error.message
        });
    }
};

// Activar personal por ID o RUT
export const activatePersonal = async (req, res) => {
    const { id, rut } = req.query;

    if ((id && rut) || (!id && !rut)) {
        return res.status(400).json({
            message: 'Debes proporcionar solo un parámetro: id o rut.'
        });
    }

    const queryParam = id ? { field: 'id', value: id } : { field: 'rut', value: rut };

    try {
        const [result] = await pool.query(
            `UPDATE personal SET disponible = 1 WHERE ${queryParam.field} = ?`,
            [queryParam.value]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: `Personal no encontrado con el ${queryParam.field} especificado`
            });
        }

        res.status(200).json({
            message: 'Personal activado exitosamente'
        });

    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Desactivar personal por ID o RUT
export const deactivatePersonal = async (req, res) => {
    const { id, rut } = req.query;

    if ((id && rut) || (!id && !rut)) {
        return res.status(400).json({
            message: 'Debes proporcionar solo un parámetro: id o rut.'
        });
    }

    const queryParam = id ? { field: 'id', value: id } : { field: 'rut', value: rut };

    try {
        const [result] = await pool.query(
            `UPDATE personal SET disponible = 0 WHERE ${queryParam.field} = ?`,
            [queryParam.value]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: `Personal no encontrado con el ${queryParam.field} especificado`
            });
        }

        res.status(200).json({
            message: 'Personal desactivado exitosamente'
        });

    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// TODO: pulir función
export const updateUltimaFecServicio = async (req, res) => {
    try {
        // Obtener todos los registros de la tabla personal
        const [personales] = await pool.query("SELECT id FROM personal ORDER BY id");

        // Iterar sobre cada registro de personal
        for (const personal of personales) {
            const personalId = personal.id;

            // Obtener la última fecha de servicio para el personal actual
            const [ultimaFecha] = await pool.query(
                `SELECT fh_llegada 
                 FROM bitacora 
                 WHERE personal_id = ? 
                 ORDER BY fh_llegada DESC 
                 LIMIT 1`,
                [personalId]
            );

            if (ultimaFecha.length > 0) {
                const fecha = ultimaFecha[0].fh_llegada;

                await pool.query(
                    `UPDATE personal 
                     SET ultima_fec_servicio = ? 
                     WHERE id = ?`,
                    [fecha, personalId]
                );
            }
        }

        res.status(200).json({ message: "Campo ultima_fec_servicio actualizado correctamente para todos los registros." });
    } catch (error) {
        console.error("Error al actualizar ultima_fec_servicio:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            error: error.message,
        });
    }
};

export const asignarMaquinas = async (req, res) => {
    const { personal_id } = req.params;
    const { maquinas } = req.body;
    const errors = [];

    try {
        // Validar personal_id
        const personalIdNumber = parseInt(personal_id);
        if (isNaN(personalIdNumber)) {
            return res.status(400).json({
                message: "ID de personal inválido"
            });
        }

        // Validar que el personal existe
        const [personalExists] = await pool.query(
            "SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0",
            [personalIdNumber]
        );
        if (personalExists.length === 0) {
            return res.status(404).json({
                message: "Personal no encontrado o está eliminado"
            });
        }

        // Validar el array de maquinas
        if (!Array.isArray(maquinas)) {
            return res.status(400).json({
                message: "El campo maquinas debe ser un array"
            });
        }

        // Iniciar transacción
        await pool.query('START TRANSACTION');

        // Insertar nuevas asignaciones
        for (const maquina_id of maquinas) {
            const maquinaIdNumber = parseInt(maquina_id);
            if (isNaN(maquinaIdNumber)) {
                errors.push(`ID de máquina inválido: ${maquina_id}`);
                continue;
            }

            // Verificar que la máquina existe
            const [maquinaExists] = await pool.query(
                "SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0",
                [maquinaIdNumber]
            );
            if (maquinaExists.length === 0) {
                errors.push(`Máquina con ID ${maquina_id} no encontrada o está eliminada`);
                continue;
            }

            // Insertar nueva asignación
            await pool.query(
                `INSERT INTO conductor_maquina (personal_id, maquina_id) 
                 VALUES (?, ?)`,
                [personalIdNumber, maquinaIdNumber]
            );
        }

        if (errors.length > 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ errors });
        }

        await pool.query('COMMIT');

        res.status(200).json({
            message: "Máquinas asignadas correctamente",
            personal_id: personalIdNumber,
            maquinas_asignadas: maquinas
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

//Quitar asignacion de maquinas
export const quitarMaquinas = async (req, res) => {
    const { personal_id, maquina_id } = req.params;
    const errors = [];

    try {
        // Validar que personal_id y maquina_id sean números válidos
        const personalIdNum = parseInt(personal_id);
        const maquinaIdNum = parseInt(maquina_id);
        if (isNaN(personalIdNum)) {
            errors.push('ID de personal inválido');
        }
        if (isNaN(maquinaIdNum)) {
            errors.push('ID de máquina inválido');
        }
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Iniciar transacción
        await pool.query('START TRANSACTION');
        try {
            // Eliminar la asociación especificada
            const deleteQuery = `
                DELETE FROM conductor_maquina
                WHERE personal_id = ?
                AND maquina_id = ?
            `;
            const [result] = await pool.query(
                deleteQuery,
                [personalIdNum, maquinaIdNum]
            );
            await pool.query('COMMIT');
            res.json({
                message: 'Máquina desasignada correctamente',
                affected_rows: result.affectedRows
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error en quitarMaquinas:', error);
        res.status(500).json({
            message: 'Error al quitar máquina',
            error: error.message
        });
    }
};

// Verificar vencimiento de licencia de conducir
export const verificarVencimientoLicencia = async () => {
    try {
      const [rows] = await pool.query("SELECT id, ven_licencia FROM personal WHERE isDeleted = 0");
      const hoy = new Date();
  
      for (const personal of rows) {
        // Verificar si la fecha de vencimiento de la licencia es nula
        if (!personal.ven_licencia) {
          console.log(`Licencia con ID ${personal.id} no tiene vencimiento registrado. Omitido.`);
          continue; // Omitir esta iteración si la fecha es nula
        }

        const fechaLicencia = new Date(personal.ven_licencia);
        
        // Comparar la fecha de licencia con la fecha actual
        if (fechaLicencia <= hoy) {
          await pool.query("UPDATE personal SET disponible = 0 WHERE id = ?", [personal.id]);
          console.log(`Personal con ID ${personal.id} marcado como no disponible.`);
        }
      }
    } catch (error) {
      console.error("Error al verificar vencimiento de licencia:", error);
    }
};

export const updateMinutosConducidos = async (req, res) => {
    try {
        console.log("Iniciando actualización de minutos conducidos");
        
        // Primero verificamos cuántos registros de personal tienen bitácoras asociadas
        const [checkResult] = await pool.query(
            `SELECT COUNT(DISTINCT p.id) as total 
             FROM personal p
             INNER JOIN bitacora b ON p.id = b.personal_id
             WHERE p.isDeleted = 0 
             AND b.isDeleted = 0
             AND b.minutos_duracion IS NOT NULL`
        );
        
        console.log("Registros de personal que necesitan actualización:", checkResult[0].total);
        
        // Consulta para actualizar los minutos conducidos
        const [result] = await pool.query(
            `UPDATE personal p
             INNER JOIN (
                SELECT personal_id, SUM(minutos_duracion) as total_minutos
                FROM bitacora
                WHERE isDeleted = 0
                AND minutos_duracion IS NOT NULL
                GROUP BY personal_id
             ) b ON p.id = b.personal_id
             SET p.minutosConducidos = b.total_minutos
             WHERE p.isDeleted = 0`
        );

        // Verificar lo que queda después de la actualización
        const [afterUpdateCheck] = await pool.query(
            `SELECT COUNT(DISTINCT p.id) as remaining 
             FROM personal p
             INNER JOIN bitacora b ON p.id = b.personal_id
             WHERE p.isDeleted = 0 
             AND b.isDeleted = 0
             AND b.minutos_duracion IS NOT NULL
             AND p.minutosConducidos IS NULL`
        );
        
        console.log("Registros restantes después de la actualización:", afterUpdateCheck[0].remaining);
        console.log("Filas afectadas según MySQL:", result.affectedRows);

        if (result.affectedRows > 0) {
            return res.json({ 
                message: "Minutos conducidos actualizados correctamente",
                registrosActualizados: result.affectedRows,
                totalEncontrados: checkResult[0].total,
                restantes: afterUpdateCheck[0].remaining
            });
        } else {
            return res.json({ 
                message: "No se encontraron registros para actualizar",
                totalEncontrados: checkResult[0].total,
                restantes: afterUpdateCheck[0].remaining
            });
        }
    } catch (error) {
        console.error("Error al actualizar minutos conducidos:", error);
        return res.status(500).json({ 
            message: "Error al actualizar los minutos conducidos", 
            error: error.message 
        });
    }
};
