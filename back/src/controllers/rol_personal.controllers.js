import {pool} from "../db.js";

export const getRolesPersonal = async(req, res)=>{
    try {
        const [rows] = await pool.query('SELECT * FROM rol_personal WHERE isDeleted = 0');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

export const getRolesPersonalPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales
        const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la primera página
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, el tamaño por defecto es 10

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const query = `
                SELECT * FROM rol_personal 
                WHERE isDeleted = 0
            `;
            const [rows] = await pool.query(query);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", se aplica paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT * FROM rol_personal 
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

// obtener por id de rol (solo activos)
export const getRolPersonal = async(req, res)=>{
    try {
        const {id} = req.params;

        // validacion de datos
        const idNumber = parseInt(id);

        if (isNaN(idNumber)) {
          res.status(400).json({
            message: "Tipo de datos inválido",
          });
        }

        const [rows] = await pool.query('SELECT * FROM rol_personal WHERE id = ? AND isDeleted = 0', [idNumber]);
        if(rows.length <=0) return res.status(404).json({
            message: 'rol_personal no encontrado'
        })
        res.json(rows[0])
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
}

export const createRolPersonal = async (req, res) => {
    let { nombre, descripcion } = req.body;
    let errors = [];

    try {
        nombre = String(nombre).trim();
        descripcion = String(descripcion).trim();

         // Validación de datos
        if (!nombre || typeof nombre !== "string") {
          errors.push("Tipo de datos inválido para 'nombre'");
        }

        if (!descripcion || typeof descripcion !== "string") {
          errors.push("Tipo de datos inválido para 'descripcion'");
        }

        // Validar longitud
        if (nombre.length > 50) {
            errors.push("Datos muy largos para 'nombre' (máximo 50 caracteres)");
        }

        if (descripcion.length > 100) {
            errors.push("Datos muy largos para 'descripcion' (máximo 100 caracteres)");
        }
        
        // Validar que no exista ya el rol con el mismo nombre
        const [rolExists] = await pool.query('SELECT * FROM rol_personal WHERE nombre = ?', [nombre]);
        if (rolExists.length > 0) {
            errors.push("Ya existe un rol_personal con ese nombre");
        }

        // Si hay errores de validación, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Crear el rol (activo por defecto, isDeleted = 0)
        const [rows] = await pool.query('INSERT INTO rol_personal (nombre, descripcion, isDeleted) VALUES (?, ?, 0)', [nombre, descripcion]);

        // Responder con el rol creado
        res.status(201).json({
            id: rows.insertId,
            nombre,
            descripcion
        });
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const deleteRolPersonal = async(req, res) =>{
    const {id} = req.params;
    try {
        // validacion de datos
        const idNumber = parseInt(id)

        if(isNaN(idNumber)){
            return res.status(400).json({
                message: "Tipo de datos inválido"
            });
        }
        
        const [result] = await pool.query('UPDATE rol_personal SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) return res.status(404).json({
            message: 'rol_personal no encontrado'
        })
        res.sendStatus(204)
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
}

export const updateRolPersonal = async (req, res) => {
    const { id } = req.params;
    let { nombre, descripcion, isDeleted } = req.body;
    let errors = [];

    try {
        // Validación de ID
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            errors.push("ID inválido");
        }

        // Crear un objeto para almacenar los campos que se actualizarán
        const updates = {};

        if (nombre !== undefined) {
            nombre = String(nombre).trim();

            if (typeof nombre !== "string") {
                errors.push("Tipo de dato inválido para 'nombre'");
            }

            // Validar longitud de nombre
            if (nombre.length > 50) {
                errors.push("Nombre no puede tener más de 50 caracteres");
            }

            // Validar que no exista ya el rol con el mismo nombre
            const [rows] = await pool.query('SELECT COUNT(*) AS count FROM rol_personal WHERE nombre = ? AND id != ?', [nombre, idNumber]);
            console.log("Respuesta de la consulta:", rows);  // Depuración de la respuesta
            if (rows[0] && rows[0].count > 0) {
                errors.push("Ya existe un rol_personal con ese nombre");
            }

            updates.nombre = nombre;
        }

        if (descripcion !== undefined) {
            descripcion = String(descripcion).trim();
            
            if (typeof descripcion !== "string") {
                errors.push("Tipo de dato inválido para 'descripcion'");
            }

            // Validar longitud de descripcion
            if (descripcion.length > 100) {
                errors.push("Descripción no puede tener más de 100 caracteres");
            }

            updates.descripcion = descripcion;
        }

        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            }
            updates.isDeleted = isDeleted;
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Construir la consulta de actualización
        const setClause = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ");

        if (!setClause) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar",
            });
        }

        const values = Object.values(updates).concat(idNumber);
        
        const [result] = await pool.query(`UPDATE rol_personal SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'rol_personal no encontrado'
            });
        }

        const [rows] = await pool.query('SELECT * FROM rol_personal WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};