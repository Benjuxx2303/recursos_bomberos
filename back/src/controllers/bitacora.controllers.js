import { pool } from "../db.js";
import { checkIfDeletedById } from '../utils/queries.js';
import { formatDateTime, validateDate, validateFloat, validateStartEndDate } from "../utils/validations.js";

// Nueva función getBitacora con filtros
export const getBitacora = async (req, res) => {
    try {
        // Obtener los parámetros de la query
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const { id, compania, rut_personal, taller, fecha_salida, isCargaCombustible, isMantencion, disponible } = req.query;

        const offset = (page - 1) * pageSize;
        
        // Base de la consulta
        let query = `
            SELECT b.id, 
                   c.nombre AS compania, 
                   p.rut AS "rut_conductor", 
                   p.nombre AS "nombre_conductor", 
                   p.apellido AS "apellido_conductor", 
                   m.patente AS "patente_maquina", 
                   tm.nombre AS tipo_maquina, 
                   DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS fh_salida, 
                   DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS fh_llegada, 
                   cl.nombre AS clave, 
                   b.direccion, 
                   b.km_salida, 
                   b.km_llegada, 
                   CASE 
                       WHEN b.km_llegada > b.km_salida AND b.km_salida IS NOT NULL AND b.km_llegada IS NOT NULL 
                       THEN b.km_llegada - b.km_salida 
                       ELSE NULL 
                   END AS "km_recorrido",
                   b.hmetro_salida, 
                   b.hmetro_llegada, 
                   CASE 
                       WHEN b.hmetro_llegada > b.hmetro_salida AND b.hmetro_salida IS NOT NULL AND b.hmetro_llegada IS NOT NULL 
                       THEN b.hmetro_llegada - b.hmetro_salida 
                       ELSE NULL 
                   END AS "hmetro_recorrido",
                   b.hbomba_salida, 
                   b.hbomba_llegada, 
                   CASE 
                       WHEN b.hbomba_llegada > b.hbomba_salida AND b.hbomba_salida IS NOT NULL AND b.hbomba_llegada IS NOT NULL 
                       THEN b.hbomba_llegada - b.hbomba_salida 
                       ELSE NULL 
                   END AS "hbomba_recorrido",
                   b.obs 
            FROM bitacora b 
            INNER JOIN compania c ON b.compania_id = c.id AND c.isDeleted = 0
            INNER JOIN clave cl ON b.clave_id = cl.id AND cl.isDeleted = 0
            INNER JOIN personal p ON b.personal_id = p.id AND p.isDeleted = 0
            INNER JOIN maquina m ON b.maquina_id = m.id AND m.isDeleted = 0
            INNER JOIN modelo mo ON m.modelo_id = mo.id
            INNER JOIN tipo_maquina tm ON mo.tipo_maquina_id = tm.id
            WHERE b.isDeleted = 0
            `;

        const params = [];

        // Añadir condiciones de filtrado
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

        // Lógica combinada para carga de combustible, mantención y disponibilidad
        if (isCargaCombustible !== undefined) {
            query += isCargaCombustible === "1" 
                ? " AND EXISTS (SELECT 1 FROM carga_combustible cc WHERE cc.bitacora_id = b.id)"
                : " AND NOT EXISTS (SELECT 1 FROM carga_combustible cc WHERE cc.bitacora_id = b.id)";
        }

        if (isMantencion !== undefined) {
            query += isMantencion === "1" 
                ? " AND EXISTS (SELECT 1 FROM mantencion m WHERE m.bitacora_id = b.id)"
                : " AND NOT EXISTS (SELECT 1 FROM mantencion m WHERE m.bitacora_id = b.id)";
        }

        // Filtro de disponibilidad
        if (disponible !== undefined) {
            if (disponible === "1") {
                query += `
                    AND NOT EXISTS (SELECT 1 FROM carga_combustible cc WHERE cc.bitacora_id = b.id)
                    AND NOT EXISTS (SELECT 1 FROM mantencion m WHERE m.bitacora_id = b.id)`;
            } else if (disponible === "0") {
                query += `
                    AND (EXISTS (SELECT 1 FROM carga_combustible cc WHERE cc.bitacora_id = b.id)
                    OR EXISTS (SELECT 1 FROM mantencion m WHERE m.bitacora_id = b.id))`;
            }
        }

        // Ordenar y aplicar paginación
        query += ` ORDER BY b.id DESC LIMIT ? OFFSET ?`;

        // Ejecutar la consulta con los parámetros de paginación
        const [rows] = await pool.query(query, [...params, pageSize, offset]);

        // Retornar los resultados
        res.json(rows);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Obtener bitácora por ID
export const getBitacoraById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT b.id, 
                    c.nombre AS compania,
                    p.rut AS 'rut_conductor',
                    m.patente AS 'patente_maquina',
                    tm.nombre AS tipo_maquina, 
                    DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS fh_salida, 
                    DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS fh_llegada, 
                    cl.nombre AS clave, 
                    b.direccion, 
                    b.km_salida, 
                    b.km_llegada, 
                    CASE 
                        WHEN b.km_llegada > b.km_salida AND b.km_salida IS NOT NULL AND b.km_llegada IS NOT NULL 
                        THEN b.km_llegada - b.km_salida 
                        ELSE NULL 
                    END AS "km_recorrido",
                    b.hmetro_salida, 
                    b.hmetro_llegada, 
                    CASE 
                        WHEN b.hmetro_llegada > b.hmetro_salida AND b.hmetro_salida IS NOT NULL AND b.hmetro_llegada IS NOT NULL 
                        THEN b.hmetro_llegada - b.hmetro_salida 
                        ELSE NULL 
                    END AS "hmetro_recorrido",
                    b.hbomba_salida, 
                    b.hbomba_llegada, 
                    CASE 
                        WHEN b.hbomba_llegada > b.hbomba_salida AND b.hbomba_salida IS NOT NULL AND b.hbomba_llegada IS NOT NULL 
                        THEN b.hbomba_llegada - b.hbomba_salida 
                        ELSE NULL 
                    END AS "hbomba_recorrido",
                    b.obs 
             FROM bitacora b 
             INNER JOIN compania c ON b.compania_id = c.id AND c.isDeleted = 0
             INNER JOIN clave cl ON b.clave_id = cl.id AND cl.isDeleted = 0 
             INNER JOIN personal p ON b.personal_id = p.id AND p.isDeleted = 0
             INNER JOIN maquina m ON b.maquina_id = m.id AND m.isDeleted = 0
             INNER JOIN modelo mo ON m.modelo_id = mo.id
             INNER JOIN tipo_maquina tm ON mo.tipo_maquina_id = tm.id
             WHERE b.isDeleted = 0 AND b.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error(error.message);
            return res.status(500).json({ message: error.message });
    }
};

// Crear una nueva bitácora (solo marca la fecha de salida)
export const createBitacora = async (req, res) => {
    let {
        compania_id, // obligatorio
        maquina_id, // obligatorio
        clave_id, // obligatorio
        personal_id, // obligatorio
        direccion,
        f_salida,
        h_salida,
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
        // Validación de los campos que no se han pasado en el cuerpo (asignación de null si no están presentes)
        direccion = direccion ? String(direccion).trim() : null;
        personal_id = personal_id !== undefined ? parseInt(personal_id) : null; // ** Cambio aquí: Verificar y asignar null a `personal_id` si no se especifica
        f_salida = f_salida ? f_salida : null;
        h_salida = h_salida ? h_salida : null;
        km_salida = km_salida !== undefined ? parseFloat(km_salida) : null;
        km_llegada = km_llegada !== undefined ? parseFloat(km_llegada) : null;
        hmetro_salida = hmetro_salida !== undefined ? parseFloat(hmetro_salida) : null;
        hmetro_llegada = hmetro_llegada !== undefined ? parseFloat(hmetro_llegada) : null;
        hbomba_salida = hbomba_salida !== undefined ? parseFloat(hbomba_salida) : null;
        hbomba_llegada = hbomba_llegada !== undefined ? parseFloat(hbomba_llegada) : null;
        obs = obs || null;

        let fh_salida = null;

        if (f_salida && h_salida) {
            const error = validateDate(f_salida, h_salida);
            if (error === false) errors.push("Fecha y hora de salida inválida.");
            else fh_salida = formatDateTime(f_salida, h_salida);
        }

        // Validación de tipo de datos
        const companiaIdNumber = parseInt(compania_id);
        const maquinaIdNumber = parseInt(maquina_id);
        const claveIdNumber = parseInt(clave_id);

        if (isNaN(companiaIdNumber) || isNaN(maquinaIdNumber) || isNaN(claveIdNumber)) {
            errors.push("Tipo de datos inválido.");
        }

        // Validaciones de claves foráneas
        await checkIfDeletedById(pool, companiaIdNumber, "compania", errors);
        if (personal_id !== null) { // ** Cambio aquí: Solo validamos si `personal_id` está presente en el cuerpo
            await checkIfDeletedById(pool, personal_id, "personal", errors); // Verificar si el personal está eliminado
        }
        await checkIfDeletedById(pool, maquinaIdNumber, "maquina", errors);
        await checkIfDeletedById(pool, claveIdNumber, "clave", errors);

        // Validaciones numéricas
        if (km_salida !== null && isNaN(km_salida)) errors.push("Km salida es requerido y debe ser un número válido.");
        if (km_llegada !== null && isNaN(km_llegada)) errors.push("Km llegada es requerido y debe ser un número válido.");
        if (hmetro_salida !== null && isNaN(hmetro_salida)) errors.push("Hmetro salida es requerido y debe ser un número válido.");
        if (hmetro_llegada !== null && isNaN(hmetro_llegada)) errors.push("Hmetro llegada es requerido y debe ser un número válido.");
        if (hbomba_salida !== null && isNaN(hbomba_salida)) errors.push("Hbomba salida es requerido y debe ser un número válido.");
        if (hbomba_llegada !== null && isNaN(hbomba_llegada)) errors.push("Hbomba llegada es requerido y debe ser un número válido.");

        if (direccion && direccion.length > 100) errors.push("La dirección no puede tener más de 100 caracteres.");

        // Si hay errores, devolver la respuesta con los errores
        if (errors.length > 0) return res.status(400).json({ errors });

        // Insertar los datos en la base de datos
        const [rows] = await pool.query(
            `INSERT INTO bitacora (
                compania_id, 
                personal_id, 
                maquina_id, 
                direccion, 
                fh_salida, 
                clave_id, 
                km_salida, 
                km_llegada, 
                hmetro_salida, 
                hmetro_llegada, 
                hbomba_salida, 
                hbomba_llegada, 
                obs, 
                isDeleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

            [
                companiaIdNumber,
                personal_id,
                maquinaIdNumber,
                direccion,
                fh_salida, // Ahora esta fecha ya está transformada al formato MySQL
                claveIdNumber,
                km_salida,
                km_llegada,
                hmetro_salida,
                hmetro_llegada,
                hbomba_salida,
                hbomba_llegada,
                obs,
                0, // isDeleted en 0
            ]
        );

        // Responder con la bitácora creada
        res.status(201).json({
            id: rows.insertId,
            compania_id: companiaIdNumber,
            personal_id: personal_id,
            maquina_id: maquinaIdNumber,
            direccion,
            fh_salida,
            claveIdNumber,
            km_salida,
            km_llegada,
            hmetro_salida,
            hmetro_llegada,
            hbomba_salida,
            hbomba_llegada,
            obs,
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ message: "Error en la creación de la bitácora", error: error.message });
    }
};

// Obtener datos del último registro de bitácora
export const getLastBitacora = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                DATE_FORMAT(fh_llegada, '%d-%m-%Y %H:%i') AS fh_llegada,
                km_llegada,
                hmetro_llegada,
                hbomba_llegada
            FROM bitacora 
            WHERE isDeleted = 0
            ORDER BY id DESC 
            LIMIT 1`
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron registros' });
        }

        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: error.message });
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

// TODO: validar la compañía de la bitácora con la del personal
// Actualizar una bitácora
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
        if (current.length === 0) return res.status(404).json({ message: "Bitácora no encontrada o ya está eliminada" });

        const updates = [];
        const values = [];

        // Actualizar solo los campos que están en el body
        if (direccion !== undefined) {
            direccion = String(direccion).trim();
            if (typeof direccion !== 'string') errors.push('Tipo de dato inválido para "direccion"');
            if (direccion.length > 100) errors.push('La dirección no puede tener más de 100 caracteres');
            
            updates.push("direccion = ?");
            values.push(direccion);
        }

        // Manejar fechas y horas
        let transformedFhSalida = null;
        let transformedFhLlegada = null;

        if (f_salida !== undefined && h_salida !== undefined) {
            const fh_salida = `${f_salida} ${h_salida}`;
            if (!validateDate(f_salida, h_salida)) errors.push('El formato de la fecha o la hora de salida es inválido. Deben ser dd-mm-aaaa y HH:mm');
            else {
                transformedFhSalida = formatDateTime(f_salida, h_salida); // Modificado: Transformación de la fecha y hora de salida
                if (transformedFhSalida) {
                    updates.push("fh_salida = ?");
                    values.push(transformedFhSalida);
                } else {
                    errors.push('Fecha de salida no válida');
                }
            }
        }

        if (f_llegada !== undefined && h_llegada !== undefined) {
            // const fh_llegada = `${f_llegada} ${h_llegada}`;
            if (!validateDate(f_llegada, h_llegada)) errors.push('El formato de la fecha o la hora de llegada es inválido. Deben ser dd-mm-aaaa y HH:mm');
            else {
                transformedFhLlegada = formatDateTime(f_llegada, h_llegada); // Modificado: Transformación de la fecha y hora de llegada
                if (transformedFhLlegada) {
                    updates.push("fh_llegada = ?");
                    values.push(transformedFhLlegada);
                } else {
                    errors.push('Fecha de llegada no válida');
                }
            }
        }

        // Validar que la fecha de salida no sea posterior a la fecha de llegada
        if (transformedFhSalida && transformedFhLlegada) {
            try {
                const isValidStartEnd = validateStartEndDate(transformedFhSalida, transformedFhLlegada); // Modificado: Validación de fechas de salida y llegada
                if (!isValidStartEnd) errors.push('La fecha de salida no puede ser posterior a la fecha de llegada');
            } catch (err) {
                errors.push(err.message); // Error de validación de fechas
            }
        }

        // Validar y agregar los campos numéricos
        if (km_llegada !== undefined) {
            const error = validateFloat(km_llegada);
            if (error) errors.push(`Km llegada: ${error}`);
            else {
                updates.push("km_llegada = ?");
                values.push(km_llegada);
            }
        }

        if (km_salida !== undefined) {
            const error = validateFloat(km_salida);
            if (error) errors.push(`Km salida: ${error}`);
            else {
                updates.push("km_salida = ?");
                values.push(km_salida);
            }
        }
        
        if (hmetro_llegada !== undefined) {
            const error = validateFloat(hmetro_llegada);
            if (error) errors.push(`Hmetro llegada: ${error}`);
            else {
                updates.push("hmetro_llegada = ?");
                values.push(hmetro_llegada);
            }
        }

        if (hmetro_salida !== undefined) {
            const error = validateFloat(hmetro_salida);
            if (error) errors.push(`Hmetro salida: ${error}`);
            else {
                updates.push("hmetro_salida = ?");
                values.push(hmetro_salida);
            }
        }

        if (hbomba_llegada !== undefined) {
            const error = validateFloat(hbomba_llegada);
            if (error) errors.push(`Hbomba llegada: ${error}`);
            else {
                updates.push("hbomba_llegada = ?");
                values.push(hbomba_llegada);
            }
        }

        if (hbomba_salida !== undefined) {
            const error = validateFloat(hbomba_salida);
            if (error) errors.push(`Hbomba salida: ${error}`);
            else {
                updates.push("hbomba_salida = ?");
                values.push(hbomba_salida);
            }
        }

        // Validaciones de existencia solo si se proporcionan
        if (compania_id !== undefined) {
            const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [compania_id]);
            if (companiaExists.length === 0) errors.push("Compania no existe o está eliminada");
            else {
                updates.push("compania_id = ?");
                values.push(compania_id);
            }
        }

        if (personal_id !== undefined) {
            const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personal_id]);
            if (personalExists.length === 0) errors.push("Personal no existe o está eliminado");
            else {
                updates.push("personal_id = ?");
                values.push(personal_id);
            }
        }

        if (maquina_id !== undefined) {
            const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquina_id]);
            if (maquinaExists.length === 0) errors.push("Máquina no existe o está eliminada");
            else {
                updates.push("maquina_id = ?");
                values.push(maquina_id);
            }
        }

        if (clave_id !== undefined) {
            const [claveExists] = await pool.query("SELECT 1 FROM clave WHERE id = ? AND isDeleted = 0", [clave_id]);
            if (claveExists.length === 0) errors.push("Clave no existe o está eliminada");
            else {
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
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) errors.push("Tipo de dato inválido para 'isDeleted'");
            else {
                updates.push("isDeleted = ?");
                values.push(isDeleted);
            }
        }

        // Si hay errores, devolverlos sin proceder con la actualización
        if (errors.length > 0) return res.status(400).json({ errors });
        
        // Construir la consulta de actualización
        const setClause = updates.join(", ");
        if (!setClause) return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        
        // Agregar el ID a los valores
        values.push(id);

        const [result] = await pool.query(
            `UPDATE bitacora SET ${setClause} WHERE id = ? AND isDeleted = 0`,
            values
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: "Bitácora no encontrada o ya está eliminada" });

        // Devolver la bitácora actualizada
        const [updatedRows] = await pool.query("SELECT * FROM bitacora WHERE id = ? AND isDeleted = 0", [id]);
        res.json(updatedRows[0]);
    } catch (error) {
        console.error(error); // Para depuración
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// TODO: Testear función.
/* Función que inicia un servicio en una bitácora, validando los datos de salida (fecha, hora), 
verificando la disponibilidad de la máquina y el personal, y actualizando la bitácora y la disponibilidad en la base de datos.
*/
export const startServicio = async (req, res) => {
    const { 
        compania_id,
        personal_id,
        maquina_id,
        f_salida, 
        h_salida,
        km_salida ,
        hmetro_salida,
        hbomba_salida,
        direccion,
        clave_id,
        obs
    } = req.body;

    const errors = [];

    try {
        // Validar campos obligatorios
        if (!compania_id) errors.push("El ID de compañía es obligatorio.");
        if (!personal_id) errors.push("El ID de personal es obligatorio.");
        if (!maquina_id) errors.push("El ID de máquina es obligatorio.");
        if (!clave_id) errors.push("El ID de clave es obligatorio.");

        if (errors.length > 0) return res.status(400).json({ errors });

        // Convertir IDs a números
        const companiaIdNum = parseInt(compania_id);
        const personalIdNum = parseInt(personal_id);
        const maquinaIdNum = parseInt(maquina_id);
        const claveIdNum = parseInt(clave_id);

        // Verificar que los IDs sean válidos
        if (isNaN(companiaIdNum)) errors.push("ID de compañía inválido.");
        if (isNaN(personalIdNum)) errors.push("ID de personal inválido.");
        if (isNaN(maquinaIdNum)) errors.push("ID de máquina inválido.");
        if (isNaN(claveIdNum)) errors.push("ID de clave inválido.");

        if (errors.length > 0) return res.status(400).json({ errors });

        // Verificar existencia de las entidades
        await checkIfDeletedById(pool, companiaIdNum, "compania", errors);
        await checkIfDeletedById(pool, personalIdNum, "personal", errors);
        await checkIfDeletedById(pool, maquinaIdNum, "maquina", errors);
        await checkIfDeletedById(pool, claveIdNum, "clave", errors);

        if (errors.length > 0) return res.status(400).json({ errors });

        // Obtener datos de la máquina
        const [maquina] = await pool.query(
            "SELECT bomba, kmetraje, hmetro_motor, hmetro_bomba FROM maquina WHERE id = ? AND isDeleted = 0",
            [maquinaIdNum]
        );

        if (maquina.length === 0) return res.status(404).json({ message: "Máquina no encontrada o eliminada." });
        
        const { bomba, kmetraje, hmetro_motor, hmetro_bomba } = maquina[0];

        // Verificar disponibilidad de máquina y personal en una sola consulta
        const query = `
            SELECT
                (SELECT disponible FROM maquina WHERE id = ? AND isDeleted = 0) AS maquinaDisponible,
                (SELECT disponible FROM personal WHERE id = ? AND isDeleted = 0) AS personalDisponible
        `;

        const [result] = await pool.query(query, [maquinaIdNum, personalIdNum]);

        // Verificar la disponibilidad de la máquina
        if (!result[0]?.maquinaDisponible || result[0].maquinaDisponible !== 1) errors.push("La máquina no está disponible.");
        
        // Verificar la disponibilidad del personal
        if (!result[0]?.personalDisponible || result[0].personalDisponible !== 1) errors.push("El personal no está disponible.");

        if (errors.length > 0) return res.status(400).json({ errors });

        // Determinar valores para km_salida, hmetro_salida, hbomba_salida
        const kmSalidaFinal = km_salida !== undefined ? parseFloat(km_salida) : kmetraje;
        const hmetroSalidaFinal = hmetro_salida !== undefined ? parseFloat(hmetro_salida) : hmetro_motor;
        // Solo usar hmetro_bomba si la máquina tiene bomba
        const hbombaSalidaFinal = bomba === 1 ? (hbomba_salida !== undefined ? parseFloat(hbomba_salida) : hmetro_bomba) : null;

        // Preparar fecha y hora
        let fhSalida;
        if (f_salida && h_salida) {
            const error = validateDate(f_salida, h_salida);
            if (error === false) errors.push("Fecha y hora de salida inválida.");
            else fhSalida = formatDateTime(f_salida, h_salida);
        } else {
            // Si no se proporciona fecha y hora, usar la actual
            const now = new Date();
            fhSalida = now.toISOString().slice(0, 19).replace('T', ' ');
        }

        if (errors.length > 0) return res.status(400).json({ errors });

        // Insertar nueva bitácora
        const [result2] = await pool.query(
            `INSERT INTO bitacora (
                compania_id, 
                personal_id, 
                maquina_id, 
                clave_id,
                direccion, 
                fh_salida, 
                km_salida, 
                hmetro_salida, 
                hbomba_salida, 
                obs,
                enCurso,
                isDeleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                companiaIdNum,
                personalIdNum,
                maquinaIdNum,
                claveIdNum,
                direccion || null,
                fhSalida,
                kmSalidaFinal,
                hmetroSalidaFinal,
                hbombaSalidaFinal,
                obs || null,
                1, // enCurso = 1
                0  // isDeleted = 0
            ]
        );

        // Actualizar disponibilidad de personal y máquina
        await pool.query("UPDATE maquina SET disponible = 0 WHERE id = ?", [maquinaIdNum]);
        await pool.query("UPDATE personal SET disponible = 0 WHERE id = ?", [personalIdNum]);

        res.status(201).json({ 
            id: result2.insertId,
            message: "Servicio iniciado correctamente." 
        });
    } catch (error) {
        return res.status(500).json({ message: "Error al iniciar el servicio", error: error.message });
    }
};

export const endServicio = async (req, res) => {
    const { id } = req.params;
    let { 
        f_llegada, 
        h_llegada, 
        km_llegada, 
        hmetro_llegada, 
        hbomba_llegada, 
        obs,
        direccion
    } = req.body;

    const errors = [];

    try {
        // Verificar existencia de la bitácora y que esté en curso
        const [bitacora] = await pool.query(
            "SELECT personal_id, maquina_id, km_salida, hmetro_salida, hbomba_salida, enCurso FROM bitacora WHERE id = ? AND isDeleted = 0",
            [id]
        );

        if (bitacora.length === 0) {
            return res.status(404).json({ message: "Bitácora no encontrada o eliminada." });
        }

        const { personal_id, maquina_id, km_salida, hmetro_salida, hbomba_salida, enCurso } = bitacora[0];

        // Verificar que la bitácora esté en curso
        if (enCurso !== 1) {
            return res.status(400).json({ message: "La bitácora no está en curso." });
        }

        // Preparar fecha y hora de llegada
        let mysqlFechaHora;
        if (f_llegada && h_llegada) {
            const error = validateDate(f_llegada, h_llegada);
            if (error === false) errors.push("Fecha y hora de llegada inválida.");
            else mysqlFechaHora = formatDateTime(f_llegada, h_llegada);
        } else {
            // Si no se proporciona fecha y hora, usar la actual
            const now = new Date();
            mysqlFechaHora = now.toISOString().slice(0, 19).replace('T', ' ');
        }

        // Si hay errores en la fecha, devolver error
        if (errors.length > 0) return res.status(400).json({ errors });

        // Validar km_llegada, hmetro_llegada, hbomba_llegada si se proporcionan
        if (km_llegada !== undefined) {
            km_llegada = parseFloat(km_llegada);
            if (isNaN(km_llegada) || km_llegada < 0) errors.push("Km llegada debe ser un número válido y positivo.");
            // Comparar con km_salida solo si ambos están definidos
            if (km_salida !== null && km_llegada < km_salida) errors.push("Km llegada no puede ser menor a los datos de salida.");
        }

        if (hmetro_llegada !== undefined) {
            hmetro_llegada = parseFloat(hmetro_llegada);
            if (isNaN(hmetro_llegada) || hmetro_llegada < 0) errors.push("Hmetro llegada debe ser un número válido y positivo.");
            // Comparar con hmetro_salida solo si ambos están definidos
            if (hmetro_salida !== null && hmetro_llegada < hmetro_salida) errors.push("Hmetro llegada no puede ser menor a los datos de salida.");
        }

        if (hbomba_llegada !== undefined) {
            hbomba_llegada = parseFloat(hbomba_llegada);
            if (isNaN(hbomba_llegada) || hbomba_llegada < 0) errors.push("Hbomba llegada debe ser un número válido y positivo.");
            // Comparar con hbomba_salida solo si ambos están definidos y la máquina tiene bomba
            if (hbomba_salida !== null && hbomba_llegada < hbomba_salida) errors.push("Hbomba llegada no puede ser menor a los datos de salida.");
        }

        if (errors.length > 0) return res.status(400).json({ errors });

        // Traer datos actuales de la máquina
        const [maquina] = await pool.query(`SELECT kmetraje, hmetro_motor, hmetro_bomba FROM maquina WHERE id = ? AND isDeleted = 0`, [maquina_id]);
        
        if (maquina.length === 0) {
            return res.status(404).json({ message: "Máquina no encontrada o eliminada." });
        }
        
        const { kmetraje, hmetro_motor, hmetro_bomba } = maquina[0];
        
        // Revisar si la máquina tiene bomba
        const [isBomba] = await pool.query(`SELECT 1 FROM maquina WHERE id = ? AND bomba = 1 AND isDeleted = 0`, [maquina_id]);
        const hasBomba = isBomba.length > 0;
        
        // Comparar los datos de llegada con los de la máquina
        let hmetro_bomba_new = hmetro_bomba;
        let hmetro_motor_new = hmetro_motor;
        let kmetraje_new = kmetraje;
        
        // Solo actualizar si se proporcionaron los valores
        if (hasBomba && hbomba_llegada !== undefined && hbomba_llegada > hmetro_bomba) {
            hmetro_bomba_new = hbomba_llegada;
        }
        
        if (km_llegada !== undefined && km_llegada > kmetraje) {
            kmetraje_new = km_llegada;
        }
        
        if (hmetro_llegada !== undefined && hmetro_llegada > hmetro_motor) {
            hmetro_motor_new = hmetro_llegada;
        }
        
        // Actualizar datos en la bitácora
        const updateFields = ['fh_llegada = ?', 'enCurso = 0'];
        const updateValues = [mysqlFechaHora];
        
        if (km_llegada !== undefined) {
            updateFields.push('km_llegada = ?');
            updateValues.push(km_llegada);
        }
        
        if (hmetro_llegada !== undefined) {
            updateFields.push('hmetro_llegada = ?');
            updateValues.push(hmetro_llegada);
        }
        
        if (hbomba_llegada !== undefined) {
            updateFields.push('hbomba_llegada = ?');
            updateValues.push(hbomba_llegada);
        }
        
        if (obs !== undefined) {
            updateFields.push('obs = ?');
            updateValues.push(obs);
        }
        
        if (direccion !== undefined) {
            updateFields.push('direccion = ?');
            updateValues.push(direccion);
        }
        
        // Añadir el ID para el WHERE
        updateValues.push(id);
        
        await pool.query(
            `UPDATE bitacora SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // Actualizar los datos de la máquina
        await pool.query(`UPDATE maquina SET
            hmetro_bomba = ?,
            hmetro_motor = ?,
            kmetraje = ?
            WHERE id = ?`, 
            [hmetro_bomba_new, hmetro_motor_new, kmetraje_new, maquina_id]
        );

        // Actualizar disponibilidad de personal y máquina
        await pool.query("UPDATE personal SET disponible = 1 WHERE id = ?", [personal_id]);
        await pool.query("UPDATE maquina SET disponible = 1 WHERE id = ?", [maquina_id]);
        
        // Actualizar la ultima fecha de servicio del personal
        await pool.query("UPDATE personal SET ultima_fec_servicio = ? WHERE id = ?", [mysqlFechaHora, personal_id]);
        
        res.json({ message: "Servicio finalizado correctamente." });
    } catch (error) {
        return res.status(500).json({ message: "Error en la finalización del servicio", error: error.message });
    }
};