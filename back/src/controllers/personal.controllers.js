import { pool } from "../db.js";
import {
    handleError,
    updateImageUrlInDb,
    uploadFileToS3
} from './fileUpload.js';

// TODO: Validación de ruts

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
                   p.img_url, p.obs, p.isDeleted,
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
        const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const query = `
                SELECT p.id, p.rut, p.nombre AS nombre, p.apellido, 
                       DATE_FORMAT(p.fec_nac, '%d-%m-%Y') AS fec_nac,
                       DATE_FORMAT(p.fec_ingreso, '%d-%m-%Y') AS fec_ingreso,
                       p.img_url, p.obs, p.isDeleted,
                       rp.nombre AS rol_personal, 
                       c.nombre AS compania
                FROM personal p
                INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
                INNER JOIN compania c ON p.compania_id = c.id
                WHERE p.isDeleted = 0
            `;
            const [rows] = await pool.query(query);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT p.id, p.rut, p.nombre AS nombre, p.apellido, 
                   DATE_FORMAT(p.fec_nac, '%d-%m-%Y') AS fec_nac,
                   DATE_FORMAT(p.fec_ingreso, '%d-%m-%Y') AS fec_ingreso,
                   p.img_url, p.obs, p.isDeleted,
                   rp.nombre AS rol_personal, 
                   c.nombre AS compania
            FROM personal p
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            WHERE p.isDeleted = 0
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.query(query, [pageSize, offset]);
        res.json(rows);
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
                   p.img_url, p.obs, p.isDeleted,
                   rp.nombre AS rol_personal, 
                   c.nombre AS compania
            FROM personal p
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
            INNER JOIN compania c ON p.compania_id = c.id
            WHERE p.id = ? AND p.isDeleted = 0
        `;
        
        const [rows] = await pool.query(query, [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: 'Personal no encontrado'
            });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
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
        obs = '',
        fec_ingreso // Nuevo campo
    } = req.body;

    let errors = []; // Arreglo para almacenar los errores

    try {
        const rolPersonalIdNumber = parseInt(rol_personal_id);
        const companiaIdNumber = parseInt(compania_id);

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

        // Validación de existencia de llaves foráneas
        const [rolPersonalExists] = await pool.query("SELECT 1 FROM rol_personal WHERE id = ? AND isDeleted = 0", [rolPersonalIdNumber]);
        if (rolPersonalExists.length === 0) {
            errors.push("Rol personal no existe o está eliminado");
        }

        const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [companiaIdNumber]);
        if (companiaExists.length === 0) {
            errors.push("Compañía no existe o está eliminada");
        }

        // Validación de fecha de nacimiento
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

<<<<<<< Updated upstream
=======
        // Validación opcional de ven_licencia (date)
        if (ven_licencia) {
            if (typeof ven_licencia !== 'string' || !fechaRegex.test(ven_licencia)) {
                errors.push('El formato de la fecha de vencimiento de licencia es inválido. Debe ser dd-mm-aaaa');
            }
        }

        // Si hay errores, devolver la respuesta con todos los errores
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

>>>>>>> Stashed changes
        // Inserción en la base de datos
        const [rows] = await pool.query(
            'INSERT INTO personal (rol_personal_id, rut, nombre, apellido, compania_id, fec_nac, img_url, obs, fec_ingreso, isDeleted) VALUES (?, ?, ?, ?, ?, STR_TO_DATE(?, "%d-%m-%Y"), ?, ?, STR_TO_DATE(?, "%d-%m-%Y"), 0)',
            [
                rolPersonalIdNumber,
                rut,
                nombre,
                apellido,
                companiaIdNumber,
                fec_nac,
                img_url,
                obs,
                fec_ingreso || null // Inserta NULL si fec_ingreso no se especifica
            ]
        );

        // Respuesta exitosa
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
            fec_ingreso
        });
    } catch (error) {
        console.error('Error: ', error);
        return res.status(500).json({
            errors: [error.message]
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
        isDeleted,
        fec_ingreso // Nuevo campo
    } = req.body;

    let errors = []; // Arreglo para acumular los errores

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
            } else {
                updates.rol_personal_id = rolPersonalIdNumber;
                const [rolPersonalExists] = await pool.query("SELECT 1 FROM rol_personal WHERE id = ? AND isDeleted = 0", [rolPersonalIdNumber]);
                if (rolPersonalExists.length === 0) {
                    errors.push("rol_personal no existe o está eliminado");
                }
            }
        }

        if (rut !== undefined) {
            if (typeof rut !== 'string') {
                errors.push("Tipo de dato inválido para 'rut'");
            } else {
                // Verificar si el rut ya existe en otro registro (independientemente del id)
                const [rutExists] = await pool.query("SELECT 1 FROM personal WHERE rut = ? AND isDeleted = 0", [rut]);
                if (rutExists.length > 0) {
                    errors.push('El RUT ya está registrado en el sistema.');
                } else {
                    updates.rut = rut;
                }
            }
        }

        if (nombre !== undefined) {
            if (typeof nombre !== 'string') {
                errors.push("Tipo de dato inválido para 'nombre'");
            } else {
                updates.nombre = nombre;
            }
        }

        if (apellido !== undefined) {
            if (typeof apellido !== 'string') {
                errors.push("Tipo de dato inválido para 'apellido'");
            } else {
                updates.apellido = apellido;
            }
        }

        if (compania_id !== undefined) {
            const companiaIdNumber = parseInt(compania_id);
            if (isNaN(companiaIdNumber)) {
                errors.push("Tipo de dato inválido para 'compania_id'");
            } else {
                updates.compania_id = companiaIdNumber;
                const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [companiaIdNumber]);
                if (companiaExists.length === 0) {
                    errors.push("compañia no existe o está eliminada");
                }
            }
        }

        if (fec_nac !== undefined) {
            if (typeof fec_nac !== 'string') {
                errors.push("Tipo de dato inválido para 'fec_nac'");
            } else {
                const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
                if (!fechaRegex.test(fec_nac)) {
                    errors.push('El formato de la fecha de nacimiento es inválido. Debe ser dd-mm-aaaa');
                } else {
                    updates.fec_nac = fec_nac;
                }
            }
        }

        // Validación opcional de fec_ingreso
        if (fec_ingreso !== undefined) {
            if (typeof fec_ingreso !== 'string') {
                errors.push("Tipo de dato inválido para 'fec_ingreso'");
            } else {
                const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
                if (!fechaRegex.test(fec_ingreso)) {
                    errors.push('El formato de la fecha de ingreso es inválido. Debe ser dd-mm-aaaa');
                } else {
                    updates.fec_ingreso = fec_ingreso;
                }
            }
        }

<<<<<<< Updated upstream
=======
        // Validación opcional de ven_licencia
        if (ven_licencia !== undefined) {
            if (typeof ven_licencia !== 'string') {
                errors.push("Tipo de dato inválido para 'ven_licencia'");
            } else {
                const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
                if (!fechaRegex.test(ven_licencia)) {
                    errors.push('El formato de la fecha de vencimiento de licencia es inválido. Debe ser dd-mm-aaaa');
                } else {
                    updates.ven_licencia = ven_licencia;
                }
            }
        }

>>>>>>> Stashed changes
        if (img_url !== undefined) {
            if (typeof img_url !== 'string') {
                errors.push("Tipo de dato inválido para 'img_url'");
            } else {
                updates.img_url = img_url;
            }
        }

        if (obs !== undefined) {
            if (typeof obs !== 'string') {
                errors.push("Tipo de dato inválido para 'obs'");
            } else {
                updates.obs = obs;
            }
        }

        if (isDeleted !== undefined) {
            if (typeof isDeleted !== 'number' || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            } else {
                updates.isDeleted = isDeleted;
            }
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Construir la consulta de actualización
        const setClause = Object.keys(updates)
<<<<<<< Updated upstream
        .map((key) => {
          if (key === 'fec_nac' || key === 'fec_ingreso') {
            return `${key} = STR_TO_DATE(?, '%d-%m-%Y')`;
          }
          return `${key} = ?`;
        })
        .join(', ');
        //la fecha se convertirá al formato adecuado usando STR_TO_DATE, y MySQL almacenará el valor correctamente sin generar errores.
=======
            .map((key) => {
                if (key === 'fec_nac' || key === 'fec_ingreso' || key === 'ven_licencia') {
                    return `${key} = STR_TO_DATE(?, '%d-%m-%Y')`;
                }
                return `${key} = ?`;
            })
            .join(', ');
>>>>>>> Stashed changes

        if (!setClause) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar"
            });
        }

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
        console.error('Error: ', error);
        return res.status(500).json({
            errors: [error.message]
        });
    }
};

const value = "personal";
const folder=value;
const tableName=value;

export const updateImage = async (req, res) => {
    const { id } = req.params;
    const file = req.file;

    // console.log({
    //     id: id,
    //     file: file,
    //     folder: folder,
    //     tableName: tableName
    // });


    if (!file) {
        return res.status(400).json({ message: "Falta el archivo." });
    }

    try {
        const data = await uploadFileToS3(file, folder);
        const newUrl = data.Location;
        await updateImageUrlInDb(id, newUrl, tableName); // Pasa el nombre de la tabla
        res.status(200).json({ message: "Imagen actualizada con éxito", url: newUrl });
    } catch (error) {
        handleError(res, error, "Error al actualizar la imagen");
    }
};