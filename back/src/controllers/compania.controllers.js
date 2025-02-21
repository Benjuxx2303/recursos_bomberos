import {pool} from "../db.js";
import {
    uploadFileToS3,
    updateImageUrlInDb,
    handleError,
} from "../utils/fileUpload.js";
import { checkIfExists } from "../utils/queries.js";

// paginado
export const getCompaniasPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales
        const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const [rows] = await pool.query('SELECT * FROM compania WHERE isDeleted = 0');
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT * 
            FROM compania 
            WHERE isDeleted = 0 
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

// compañia por id (solo activos)
export const getCompania = async(req, res)=>{
    const {id} = req.params;
    try {
        // validacion de datos
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
          res.status(400).json({
            message: "Tipo de datos inválido",
          });
        }
        
        const [rows] = await pool.query('SELECT * FROM compania WHERE id = ? AND isDeleted = 0', [idNumber]);
        if(rows.length <=0) return res.status(404).json({
            message: 'Compañía no encontrada'
        })
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        })
    }
}

export const createCompania = async (req, res) => {
    let { 
        nombre, 
        direccion 
    } = req.body;
    const errors = []; // Arreglo para capturar errores

    try {
        // Validar datos antes de procesarlos
        if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
            errors.push("Tipo de datos inválido para 'nombre'");
        }

        if (!direccion || typeof direccion !== "string" || direccion.trim().length === 0) {
            errors.push("Tipo de datos inválido para 'direccion'");
        }

        // Validar longitud de los campos si son válidos
        if (nombre && nombre.length > 50) {
            errors.push("El nombre de la compañía es demasiado largo");
        }

        if (direccion && direccion.length > 100) {
            errors.push("La dirección de la compañía es demasiado larga");
        }

        // Si hay errores, devolverlos inmediatamente
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Manejar la carga de archivos si existen
        let img_url = null;
        if (req.files) {
            const imagen = req.files.imagen ? req.files.imagen[0] : null;

            if (imagen) {
                try {
                    const imgData = await uploadFileToS3(imagen, "compania");
                    if (imgData && imgData.Location) {
                        img_url = imgData.Location;
                    } else {
                        errors.push("No se pudo obtener la URL de la imagen");
                    }
                } catch (error) {
                    errors.push("Error al subir la imagen", error.message);
                }
            }
        }

        // Validar que no exista una compañía con el mismo nombre
        checkIfExists(pool, nombre, 'nombre', 'compania', errors);
        
        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Insertar la compañía
        const [rows] = await pool.query('INSERT INTO compania (nombre, direccion, img_url, isDeleted) VALUES (?, ?, ?, 0)', [nombre.trim(), direccion.trim(), img_url]);

        res.status(201).json({
            id: rows.insertId,
            nombre: nombre.trim(),
            direccion: direccion.trim(),
            img_url,
            isDeleted: 0
        });
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", errors: [error.message] });
    }
};


// eliminar compañia por id
export const deleteCompania = async(req, res) =>{
    const {id} = req.params;
    try {
        // validacion de datos
        const idNumber = parseInt(id);

        if(isNaN(idNumber)){
            res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }

        const [result] = await pool.query('UPDATE compania SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) return res.status(404).json({
            message: 'Compañía no encontrada'
        })
        res.sendStatus(204)
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        })
    }
}

export const updateCompania = async (req, res) => {
    const { id } = req.params;
    let { 
        nombre,
        direccion,
        // img_url, 
        isDeleted } = req.body;
    const errors = []; // Arreglo para capturar errores

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        // Validaciones
        const updates = {};
        
        // manejo de subida de imagen S3
        if (req.files) {
            const imagen = req.files.imagen ? req.files.imagen[0] : null;

            if (imagen) {
                try {
                    const imgData = await uploadFileToS3(imagen, "compania");
                    if (imgData && imgData.Location) {
                        updates.img_url = imgData.Location;
                    } else {
                        errors.push("No se pudo obtener la URL de la imagen");
                    }
                } catch (error) {
                    errors.push("Error al subir la imagen", error.message);
                }
            }
        }

        if (nombre !== undefined) {
            nombre = String(nombre).trim();

            if (typeof nombre !== "string") {
                errors.push("Tipo de dato inválido para 'nombre'");
            }

            // Validar la longitud del nombre
            if (nombre.length > 50) {
                errors.push("El nombre de la compañía es demasiado largo");
            }

            // Validar que no exista una compañía con el mismo nombre
            const [companias] = await pool.query('SELECT * FROM compania WHERE nombre = ? AND id != ?', [nombre, idNumber]);
            if (companias.length > 0) {
                errors.push("Ya existe una compañía con el mismo nombre");
            }

            updates.nombre = nombre;
        }

        if (direccion !== undefined) {
            direccion = String(direccion).trim();

            if (typeof direccion !== "string") {
                errors.push("Tipo de dato inválido para 'direccion'");
            }

            // Validar la longitud de la dirección
            if (direccion.length > 100) {
                errors.push("La dirección de la compañía es demasiado larga");
            }

            updates.direccion = direccion;
        }

        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            }
            updates.isDeleted = isDeleted;
        }

        // Si se encontraron errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Construir la consulta de actualización
        const setClause = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ");

        if (!setClause) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar"
            });
        }

        const values = Object.values(updates).concat(idNumber);
        const [result] = await pool.query(`UPDATE compania SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Compañía no encontrada'
            });
        }

        const [rows] = await pool.query('SELECT * FROM compania WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        errors.push(error.message);
        return res.status(500).json({
            message: "Error interno del servidor",
            errors
        });
    }
};