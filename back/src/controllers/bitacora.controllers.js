import { pool } from "../db.js";
import { validateFloat } from "../utils/validations.js";

// Nueva función getBitacora con filtros
export const getBitacora = async (req, res) => {
    try {
        const { id, compania, rut_personal, taller, fecha_salida } = req.query;
        let query = `
            SELECT b.id, 
                   c.nombre AS compania, 
                   p.rut AS "rut_conductor", 
                   m.patente AS "patente_maquina", 
                   tm.nombre AS tipo_maquina, 
                   DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS fh_salida, 
                   DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS fh_llegada, 
                   cl.nombre AS clave, 
                   b.direccion, 
                   b.km_salida, 
                   b.km_llegada, 
                   b.hmetro_salida, 
                   b.hmetro_llegada, 
                   b.hbomba_salida, 
                   b.hbomba_llegada, 
                   b.obs 
            FROM bitacora b 
            INNER JOIN compania c ON b.compania_id = c.id AND c.isDeleted = 0
            INNER JOIN clave cl ON b.clave_id = cl.id AND cl.isDeleted = 0 
            INNER JOIN personal p ON b.personal_id = p.id AND p.isDeleted = 0
            INNER JOIN maquina m ON b.maquina_id = m.id AND m.isDeleted = 0
            INNER JOIN tipo_maquina tm ON m.tipo_maquina_id = tm.id AND tm.isDeleted = 0
            WHERE b.isDeleted = 0`;

        const params = [];

        if (id) {
            query += " AND b.id = ?";
            params.push(id);
        }
        if (compania) {
            query += " AND c.nombre LIKE ?";
            params.push(`%${compania}%`);
        }
        if (rut_personal) {
            query += " AND p.rut LIKE ?";
            params.push(`%${rut_personal}%`);
        }
        if (taller) {
            query += " AND tm.nombre LIKE ?";
            params.push(`%${taller}%`);
        }
        if (fecha_salida) {
            query += " AND DATE_FORMAT(b.fh_salida, '%d-%m-%Y') = ?";
            params.push(fecha_salida);
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Paginado
export const getBitacoraPage = async (req, res) => {
    try {
        // Obtener los parámetros de la query
        const page = parseInt(req.query.page) || 1; // Si no se pasa 'page', por defecto será 1
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se pasa 'pageSize', por defecto será 10

        // Calcular el desplazamiento (offset)
        const offset = (page - 1) * pageSize;

        // Consulta con paginación
        const query = `
            SELECT b.id, 
                    c.nombre AS compania, 
                    p.rut AS "rut_conductor", 
                    m.patente AS "patente_maquina", 
                    tm.nombre AS tipo_maquina, 
                    DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS fh_salida, 
                    DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS fh_llegada, 
                    cl.nombre AS clave, 
                    b.direccion, 
                    b.km_salida, 
                    b.km_llegada, 
                    b.hmetro_salida, 
                    b.hmetro_llegada, 
                    b.hbomba_salida, 
                    b.hbomba_llegada, 
                    b.obs 
            FROM bitacora b 
            INNER JOIN compania c ON b.compania_id = c.id AND c.isDeleted = 0
            INNER JOIN clave cl ON b.clave_id = cl.id AND cl.isDeleted = 0 
            INNER JOIN personal p ON b.personal_id = p.id AND p.isDeleted = 0
            INNER JOIN maquina m ON b.maquina_id = m.id AND m.isDeleted = 0
            INNER JOIN tipo_maquina tm ON m.tipo_maquina_id = tm.id AND tm.isDeleted = 0
            WHERE b.isDeleted = 0
            LIMIT ? OFFSET ?`;

        // Ejecutar la consulta con los parámetros de paginación
        const [rows] = await pool.query(query, [pageSize, offset]);

        // Retornar los resultados
        res.json(rows);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Obtener bitácora por ID
export const getBitacoraById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT b.id, 
                    c.nombre AS compania, 
                    p.rut AS "rut_conductor", 
                    m.patente AS "patente_maquina", 
                    tm.nombre AS tipo_maquina, 
                    DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS fh_salida, 
                    DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS fh_llegada, 
                    cl.nombre AS clave, 
                    b.direccion, 
                    b.km_salida, 
                    b.km_llegada, 
                    b.hmetro_salida, 
                    b.hmetro_llegada, 
                    b.hbomba_salida, 
                    b.hbomba_llegada, 
                    b.obs 
             FROM bitacora b 
             INNER JOIN compania c ON b.compania_id = c.id AND c.isDeleted = 0
             INNER JOIN clave cl ON b.clave_id = cl.id AND cl.isDeleted = 0 
             INNER JOIN personal p ON b.personal_id = p.id AND p.isDeleted = 0
             INNER JOIN maquina m ON b.maquina_id = m.id AND m.isDeleted = 0
             INNER JOIN tipo_maquina tm ON m.tipo_maquina_id = tm.id AND tm.isDeleted = 0
             WHERE b.isDeleted = 0 AND b.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};



// Crear una nueva bitácora
export const createBitacora = async (req, res) => {
    let {
        compania_id,
        personal_id,
        maquina_id,
        direccion,
        f_salida,
        h_salida,
        f_llegada,
        h_llegada,
        clave_id,
        km_salida,
        km_llegada,
        hmetro_salida,
        hmetro_llegada,
        hbomba_salida,
        hbomba_llegada,
        obs,
    } = req.body;

    const errors = []; // Array para capturar errores

    try {
        direccion = String(direccion).trim();

        // Concatenar fecha y hora solo si ambas están presentes
        let fh_salida = null;
        let fh_llegada = null;

        if (f_salida && h_salida) {
            fh_salida = `${f_salida} ${h_salida}`;
        }
        if (f_llegada && h_llegada) {
            fh_llegada = `${f_llegada} ${h_llegada}`;
        }

        // Validación de datos
        const companiaIdNumber = parseInt(compania_id);
        const personalIdNumber = parseInt(personal_id);
        const maquinaIdNumber = parseInt(maquina_id);
        const claveIdNumber = parseInt(clave_id);

        if (
            isNaN(companiaIdNumber) ||
            isNaN(personalIdNumber) ||
            isNaN(maquinaIdNumber) ||
            isNaN(claveIdNumber) ||
            typeof direccion !== 'string'
        ) {
            errors.push('Tipo de datos inválido');
        }

        // Validación de existencia de llaves foráneas
        const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [companiaIdNumber]);
        if (companiaExists.length === 0) {
            errors.push("Compania no existe o está eliminada");
        }

        // TODO: validacion de conductor (si existe valor en el campo 'ven_licencia')
        const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personalIdNumber]);
        if (personalExists.length === 0) {
            errors.push("Personal no existe o está eliminado");
        }

        const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquinaIdNumber]);
        if (maquinaExists.length === 0) {
            errors.push("Máquina no existe o está eliminada");
        }

        const [claveExists] = await pool.query("SELECT 1 FROM clave WHERE id = ? AND isDeleted = 0", [claveIdNumber]);
        if (claveExists.length === 0) {
            errors.push("Clave no existe o está eliminada");
        }

        if (direccion.length > 100) {
            errors.push('La dirección no puede tener más de 100 caracteres');
        }

        // TODO: Validar que los datos no sean menores a los de la última bitácora del mismo vehículo
        // validación de números
        if(km_llegada !== undefined) {
            const error = validateFloat(km_llegada);
            if (error) {
                errors.push(`Km llegada: ${error}`);
            }
        } else {
            errors.push('Km llegada es requerido');
        }

        if(km_salida !== undefined) {
            const error = validateFloat(km_salida);
            if (error) {
                errors.push(`Km salida: ${error}`);
            }
        } else {
            errors.push('Km salida es requerido');
        }

        if(hmetro_llegada !== undefined) {
            const error = validateFloat(hmetro_llegada);
            if (error) {
                errors.push(`Hmetro llegada: ${error}`);
            }
        } else {
            errors.push('Hmetro llegada es requerido');
        }

        if(hmetro_salida !== undefined) {
            const error = validateFloat(hmetro_salida);
            if (error) {
                errors.push(`Hmetro salida: ${error}`);
            }
        } else {
            errors.push('Hmetro salida es requerido');
        }

        if(hbomba_llegada !== undefined) {
            const error = validateFloat(hbomba_llegada);
            if (error) {
                errors.push(`Hbomba llegada: ${error}`);
            }
        } else {
            errors.push('Hbomba llegada es requerido');
        }

        if(hbomba_salida !== undefined) {
            const error = validateFloat(hbomba_salida);
            if (error) {
                errors.push(`Hbomba salida: ${error}`);
            }
        } else {
            errors.push('Hbomba salida es requerido');
        }

        // TODO: Validar que la fecha y hora de salida no sea mayor a la de llegada y viceversa
        // Validación de fecha y hora si están presentes
        const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
        const horaRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

        if (f_salida && h_salida && (!fechaRegex.test(f_salida) || !horaRegex.test(h_salida))) {
            errors.push('El formato de la fecha o la hora de salida es inválido. Deben ser dd-mm-aaaa y HH:mm');
        }

        if (f_llegada && h_llegada && (!fechaRegex.test(f_llegada) || !horaRegex.test(h_llegada))) {
            errors.push('El formato de la fecha o la hora de llegada es inválido. Deben ser dd-mm-aaaa y HH:mm');
        }

        // Si hay errores, devolverlos sin proceder con la inserción
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Preparar el valor de obs; si es nulo o no viene, se omitirá
        const obsValue = obs || null;

        // Inserción en la base de datos
        const [rows] = await pool.query(
            'INSERT INTO bitacora (compania_id, personal_id, maquina_id, direccion, fh_salida, fh_llegada, clave_id, km_salida, km_llegada, hmetro_salida, hmetro_llegada, hbomba_salida, hbomba_llegada, obs, isDeleted) VALUES (?, ?, ?, ?, STR_TO_DATE(?, "%d-%m-%Y %H:%i"), STR_TO_DATE(?, "%d-%m-%Y %H:%i"), ?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [
                companiaIdNumber,
                personalIdNumber,
                maquinaIdNumber,
                direccion,
                fh_salida,
                fh_llegada,
                claveIdNumber,
                km_salida,
                km_llegada,
                hmetro_salida,
                hmetro_llegada,
                hbomba_salida,
                hbomba_llegada,
                obsValue
            ]
        );

        res.status(201).json({
            id: rows.insertId,
            companiaIdNumber,
            personalIdNumber,
            maquinaIdNumber,
            direccion,
            fh_salida,
            fh_llegada,
            claveIdNumber,
            km_salida,
            km_llegada,
            hmetro_salida,
            hmetro_llegada,
            hbomba_salida,
            hbomba_llegada,
            obsValue
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error en la creación de la bitácora', error: error.message });
    }
};


// Dar de baja (marcar como inactivo)
export const deleteBitacora = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            "UPDATE bitacora SET isDeleted = 1 WHERE id = ?",
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Bitácora no encontrada" });
        }

        res.status(204).end();
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

/// Actualizar una bitácora
export const updateBitacora = async (req, res) => {
    const { id } = req.params;
    let {
        compania_id,
        personal_id,
        maquina_id,
        clave_id,
        direccion,
        f_salida,
        h_salida,
        f_llegada,
        h_llegada,
        km_salida,
        km_llegada,
        hmetro_salida,
        hmetro_llegada,
        hbomba_salida,
        hbomba_llegada,
        obs,
        isDeleted,
    } = req.body;

    const errors = []; // Array para capturar errores

    try {
        // Obtener la bitácora existente
        const [current] = await pool.query("SELECT * FROM bitacora WHERE id = ? AND isDeleted = 0", [id]);
        if (current.length === 0) {
            return res.status(404).json({ message: "Bitácora no encontrada o ya está eliminada" });
        }

        const updates = [];
        const values = [];

        // Actualizar solo los campos que están en el body
        if (direccion !== undefined) {
            direccion = String(direccion).trim();
            if(typeof direccion !== 'string') {
                errors.push('Tipo de dato inválido para "direccion"');
            }
            if (direccion.length > 100) {
                errors.push('La dirección no puede tener más de 100 caracteres');
            }
            updates.push("direccion = ?");
            values.push(direccion);
        }

        // Manejar fechas y horas
        if (f_salida !== undefined && h_salida !== undefined) {
            const fh_salida = `${f_salida} ${h_salida}`;
            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            const horaRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!fechaRegex.test(f_salida) || !horaRegex.test(h_salida)) {
                errors.push('El formato de la fecha o la hora de salida es inválido. Deben ser dd-mm-aaaa y HH:mm');
            } else {
                updates.push("fh_salida = STR_TO_DATE(?, '%d-%m-%Y %H:%i')");
                values.push(fh_salida);
            }
        }

        if (f_llegada !== undefined && h_llegada !== undefined) {
            const fh_llegada = `${f_llegada} ${h_llegada}`;
            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            const horaRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!fechaRegex.test(f_llegada) || !horaRegex.test(h_llegada)) {
                errors.push('El formato de la fecha o la hora de llegada es inválido. Deben ser dd-mm-aaaa y HH:mm');
            } else {
                updates.push("fh_llegada = STR_TO_DATE(?, '%d-%m-%Y %H:%i')");
                values.push(fh_llegada);
            }
        }

        // Validar y agregar los campos numéricos
        if (km_llegada !== undefined) {
            const error = validateFloat(km_llegada);
            if (error) {
                errors.push(`Km llegada: ${error}`);
            } else {
                updates.push("km_llegada = ?");
                values.push(km_llegada);
            }
        }

        if (km_salida !== undefined) {
            const error = validateFloat(km_salida);
            if (error) {
                errors.push(`Km salida: ${error}`);
            } else {
                updates.push("km_salida = ?");
                values.push(km_salida);
            }
        }
        
        if (hmetro_llegada !== undefined) {
            const error = validateFloat(hmetro_llegada);
            if (error) {
                errors.push(`Hmetro llegada: ${error}`);
            } else {
                updates.push("hmetro_llegada = ?");
                values.push(hmetro_llegada);
            }
        }

        if (hmetro_salida !== undefined) {
            const error = validateFloat(hmetro_salida);
            if (error) {
                errors.push(`Hmetro salida: ${error}`);
            } else {
                updates.push("hmetro_salida = ?");
                values.push(hmetro_salida);
            }
        }

        if (hbomba_llegada !== undefined) {
            const error = validateFloat(hbomba_llegada);
            if (error) {
                errors.push(`Hbomba llegada: ${error}`);
            } else {
                updates.push("hbomba_llegada = ?");
                values.push(hbomba_llegada);
            }
        }

        if (hbomba_salida !== undefined) {
            const error = validateFloat(hbomba_salida);
            if (error) {
                errors.push(`Hbomba salida: ${error}`);
            } else {
                updates.push("hbomba_salida = ?");
                values.push(hbomba_salida);
            }
        }

        // Validaciones de existencia solo si se proporcionan
        if (compania_id !== undefined) {
            const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [compania_id]);
            if (companiaExists.length === 0) {
                errors.push("Compania no existe o está eliminada");
            } else {
                updates.push("compania_id = ?");
                values.push(compania_id);
            }
        }

        if (personal_id !== undefined) {
            const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personal_id]);
            if (personalExists.length === 0) {
                errors.push("Personal no existe o está eliminado");
            } else {
                updates.push("personal_id = ?");
                values.push(personal_id);
            }
        }

        if (maquina_id !== undefined) {
            const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquina_id]);
            if (maquinaExists.length === 0) {
                errors.push("Máquina no existe o está eliminada");
            } else {
                updates.push("maquina_id = ?");
                values.push(maquina_id);
            }
        }

        if (clave_id !== undefined) {
            const [claveExists] = await pool.query("SELECT 1 FROM clave WHERE id = ? AND isDeleted = 0", [clave_id]);
            if (claveExists.length === 0) {
                errors.push("Clave no existe o está eliminada");
            } else {
                updates.push("clave_id = ?");
                values.push(clave_id);
            }
        }

        // Incluir obs en la actualización
        if (obs !== undefined) {
            updates.push("obs = ?");
            values.push(obs);
        }

        // Validación y asignación de isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            } else {
                updates.push("isDeleted = ?");
                values.push(isDeleted);
            }
        }

        // Si hay errores, devolverlos sin proceder con la actualización
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Construir la consulta de actualización
        const setClause = updates.join(", ");
        if (!setClause) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        }

        // Agregar el ID a los valores
        values.push(id);

        const [result] = await pool.query(
            `UPDATE bitacora SET ${setClause} WHERE id = ? AND isDeleted = 0`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Bitácora no encontrada o ya está eliminada" });
        }

        // Devolver la bitácora actualizada
        const [updatedRows] = await pool.query("SELECT * FROM bitacora WHERE id = ? AND isDeleted = 0", [id]);
        res.json(updatedRows[0]);
    } catch (error) {
        console.error(error); // Para depuración
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};
