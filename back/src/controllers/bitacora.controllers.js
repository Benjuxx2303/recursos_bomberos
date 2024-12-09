import { pool } from "../db.js";

// Nueva función getBitacora con filtros
export const getBitacora = async (req, res) => {
    try {
        const { id, compania, rut_personal, taller, fecha_salida } = req.query;
        let query = `
            SELECT b.id, 
                   c.nombre AS compania, 
                   p.rut AS "rut_personal", 
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
            INNER JOIN personal p ON b.personal_id = p.id AND p.isDeleted = 0 
            INNER JOIN clave cl ON b.clave_id = cl.id AND cl.isDeleted = 0 
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
                    p.rut AS "rut_personal", 
                    m.patente AS "patente_maquina", 
                    tm.nombre AS tipo_maquina, 
                    DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS fh_salida, 
                    DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS fh_llegada, 
                    cl.nombre AS clave, 
                    b.direccion, 
                    b.km_salida,                     b.km_llegada, 
                    b.hmetro_salida, 
                    b.hmetro_llegada, 
                    b.hbomba_salida, 
                    b.hbomba_llegada, 
                    b.obs 
            FROM bitacora b 
            INNER JOIN compania c ON b.compania_id = c.id AND c.isDeleted = 0
            INNER JOIN personal p ON b.personal_id = p.id AND p.isDeleted = 0
            INNER JOIN clave cl ON b.clave_id = cl.id AND cl.isDeleted = 0 
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
                    p.rut AS "rut_personal", 
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
            INNER JOIN personal p ON b.personal_id = p.id AND p.isDeleted = 0
             INNER JOIN clave cl ON b.clave_id = cl.id AND cl.isDeleted = 0 
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
    const {
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

    try {
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
            return res.status(400).json({ message: 'Tipo de datos inválido' });
        }

        // Validación de existencia de llaves foráneas
        const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [companiaIdNumber]);
        if (companiaExists.length === 0) {
            return res.status(400).json({ message: "Compania no existe o está eliminada" });
        }

        const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personalIdNumber]);
        if (personalExists.length === 0) {
            return res.status(400).json({ message: "Personal no existe o está eliminado" });
        }

        const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquinaIdNumber]);
        if (maquinaExists.length === 0) {
            return res.status(400).json({ message: "Máquina no existe o está eliminada" });
        }

        const [claveExists] = await pool.query("SELECT 1 FROM clave WHERE id = ? AND isDeleted = 0", [claveIdNumber]);
        if (claveExists.length === 0) {
            return res.status(400).json({ message: "Clave no existe o está eliminada" });
        }

        // Validación de fecha y hora si están presentes
        const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
        const horaRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

        if (f_salida && h_salida && (!fechaRegex.test(f_salida) || !horaRegex.test(h_salida))) {
            return res.status(400).json({
                message: 'El formato de la fecha o la hora de salida es inválido. Deben ser dd-mm-aaaa y HH:mm'
            });
        }

        if (f_llegada && h_llegada && (!fechaRegex.test(f_llegada) || !horaRegex.test(h_llegada))) {
            return res.status(400).json({
                message: 'El formato de la fecha o la hora de llegada es inválido. Deben ser dd-mm-aaaa y HH:mm'
            });
        }

        // Preparar el valor de obs
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
            compania_id: companiaIdNumber,
            personal_id: personalIdNumber,
            maquina_id: maquinaIdNumber,
            direccion,
            fh_salida,
            fh_llegada,
            clave_id: claveIdNumber,
            km_salida,
            km_llegada,
            hmetro_salida,
            hmetro_llegada,
            hbomba_salida,
            hbomba_llegada,
            obs: obsValue
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error en la creación de la bitácora' });
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

// Actualizar una bitácora
export const updateBitacora = async (req, res) => {
    const { id } = req.params;
    const {
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
            updates.push("direccion = ?");
            values.push(direccion);
        }

        // Manejar fechas y horas
        if (f_salida !== undefined && h_salida !== undefined) {
            const fh_salida = `${f_salida} ${h_salida}`;
            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            const horaRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!fechaRegex.test(f_salida) || !horaRegex.test(h_salida)) {
                return res.status(400).json({
                    message: 'El formato de la fecha o la hora de salida es inválido. Deben ser dd-mm-aaaa y HH:mm'
                });
            }
            updates.push("fh_salida = STR_TO_DATE(?, '%d-%m-%Y %H:%i')");
            values.push(fh_salida);
        }

        if (f_llegada !== undefined && h_llegada !== undefined) {
            const fh_llegada = `${f_llegada} ${h_llegada}`;
            const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            const horaRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!fechaRegex.test(f_llegada) || !horaRegex.test(h_llegada)) {
                return res.status(400).json({
                    message: 'El formato de la fecha o la hora de llegada es inválido. Deben ser dd-mm-aaaa y HH:mm'
                });
            }
            updates.push("fh_llegada = STR_TO_DATE(?, '%d-%m-%Y %H:%i')");
            values.push(fh_llegada);
        }

        // Validaciones y actualizaciones para los demás campos numéricos
        const floatFields = ['km_salida', 'km_llegada', 'hmetro_salida', 'hmetro_llegada', 'hbomba_salida', 'hbomba_llegada'];
        for (const field of floatFields) {
            if (req.body[field] !== undefined) {
                const value = parseFloat(req.body[field]);
                if (isNaN(value)) {
                    return res.status(400).json({ message: `Tipo de dato inválido para '${field}'` });
                }
                updates.push(`${field} = ?`);
                values.push(value);
            }
        }

        // Validaciones de existencia solo si se proporcionan
        if (compania_id !== undefined) {
            const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [compania_id]);
            if (companiaExists.length === 0) {
                return res.status(400).json({ message: "Compania no existe o está eliminada" });
            }
            updates.push("compania_id = ?");
            values.push(compania_id);
        }

        if (personal_id !== undefined) {
            const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personal_id]);
            if (personalExists.length === 0) {
                return res.status(400).json({ message: "Personal no existe o está eliminado" });
            }
            updates.push("personal_id = ?");
            values.push(personal_id);
        }

        if (maquina_id !== undefined) {
            const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquina_id]);
            if (maquinaExists.length === 0) {
                return res.status(400).json({ message: "Máquina no existe o está eliminada" });
            }
            updates.push("maquina_id = ?");
            values.push(maquina_id);
        }

        if (clave_id !== undefined) {
            const [claveExists] = await pool.query("SELECT 1 FROM clave WHERE id = ? AND isDeleted = 0", [clave_id]);
            if (claveExists.length === 0) {
                return res.status(400).json({ message: "Clave no existe o está eliminada" });
            }
            updates.push("clave_id = ?");
            values.push(clave_id);
        }

        // Incluir obs en la actualización
        if (obs !== undefined) {
            updates.push("obs = ?");
            values.push(obs);
        }

        // Validación y asignación de isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                return res.status(400).json({ message: "Tipo de dato inválido para 'isDeleted'" });
            }
            updates.push("isDeleted = ?");
            values.push(isDeleted);
        }

        // Construir la consulta de actualización
        const setClause = updates.join(", ");
        if (!setClause) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar"
            });
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
