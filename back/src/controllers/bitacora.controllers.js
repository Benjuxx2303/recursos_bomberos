import jwt from 'jsonwebtoken';
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

        // Aplicar filtro de compañía desde el middleware
        const companiaFilter = req.companyFilter;

        const offset = (page - 1) * pageSize;
        
        // Base de la consulta
        let query = `
            SELECT b.id, 
                   m.codigo AS 'codigo_maquina',
                   m.id AS 'maquina_id',
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
                // Aplicar filtro por personal si existe
          if (req.personalFilter) {
        query += ' AND personal_id = ?';
        params.push(req.personalFilter);       
       }
         // Aplicar filtro de compañía desde el middleware si existe
        if (companiaFilter) {
            query += " AND c.id = ?";
            params.push(companiaFilter);
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
            console.log("Aplicando filtro de disponibilidad:", disponible);
            // Convertir a entero para asegurar comparación numérica en MySQL
            const dispValue = parseInt(disponible);
            console.log("Valor convertido:", dispValue);
            
            if (!isNaN(dispValue)) {
                query += ` AND b.disponible = ?`;
                params.push(dispValue);
            } else {
                console.warn("El valor de disponibilidad no es un número válido:", disponible);
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


// Bitacora con todos los filtros
export const getBitacoraFull = async (req, res) => {
    try {
        // Obtener los parámetros de la query
        const {
            // Parámetros de paginación
            page,
            pageSize,
            noPagination,
            
            // Parámetros de ordenamiento
            orderBy = 'id',
            orderDirection = 'DESC',
            
            // Parámetros de filtrado existentes
            id,
            compania,
            rut_personal,
            taller,
            fecha_salida,
            isCargaCombustible,
            isMantencion,
            disponible,
            
            // Nuevos parámetros de filtrado
            startDate,
            endDate,
            dateField = 'fh_salida', // Campo por defecto para filtrado de fechas
            personal_id,
            maquina_id,
            compania_id,
            clave_id,
            searchDireccion,
            createdAtStart,
            createdAtEnd
        } = req.query;

        // Configuración de paginación
        const usePagination = noPagination !== '1';
        const currentPage = parseInt(page) || 1;
        const itemsPerPage = parseInt(pageSize) || 6;
        const offset = (currentPage - 1) * itemsPerPage;

        // Validar campo de ordenamiento permitido
        const allowedOrderFields = [
            'id', 'codigo_maquina', 'compania', 'rut_conductor', 
            'nombre_conductor', 'apellido_conductor', 'patente_maquina', 
            'tipo_maquina', 'fh_salida', 'fh_llegada', 'clave', 
            'direccion', 'km_salida', 'km_llegada', 'km_recorrido',
            'hmetro_salida', 'hmetro_llegada', 'hmetro_recorrido',
            'hbomba_salida', 'hbomba_llegada', 'hbomba_recorrido',
            'createdAt'
        ];

        const finalOrderBy = allowedOrderFields.includes(orderBy) ? orderBy : 'id';
        const finalOrderDirection = orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        // Base de la consulta
        let baseQuery = `
            SELECT b.id, 
                   m.codigo AS 'codigo_maquina',
                   m.id AS 'maquina_id',
                   c.nombre AS compania, 
                   c.id AS 'compania_id',
                   p.id AS 'personal_id',
                   p.rut AS "rut_conductor", 
                   p.nombre AS "nombre_conductor", 
                   p.apellido AS "apellido_conductor", 
                   m.patente AS "patente_maquina", 
                   tm.nombre AS tipo_maquina,
                   b.minutos_duracion, 
                   DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS fh_salida, 
                   DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS fh_llegada, 
                   cl.id AS 'clave_id',
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
                   TIMESTAMPDIFF(MINUTE, b.fh_salida, b.fh_llegada) AS minutos_duracion,
                   DATE_FORMAT(b.createdAt, '%d-%m-%Y %H:%i') AS createdAt,
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
        let companiaId = null;

            // Aplicar filtro de compañía desde el middleware si existe y no hay un compania_id específico
        if (req.companyFilter) {
        companiaId = req.companyFilter;
        baseQuery += " AND b.compania_id = ?";
        params.push(companiaId);
        }

        // Filtros existentes
        if (id) {
            baseQuery += " AND b.id = ?";
            params.push(id);
        }
        if (compania) {
            baseQuery += " AND c.nombre LIKE ?";
            params.push(`%${compania}%`);
        }
        if (rut_personal) {
            baseQuery += " AND p.rut LIKE ?";
            params.push(`%${rut_personal}%`);
        }
        if (taller) {
            baseQuery += " AND tm.nombre LIKE ?";
            params.push(`%${taller}%`);
        }
        if (fecha_salida) {
            baseQuery += " AND DATE_FORMAT(b.fh_salida, '%d-%m-%Y') = ?";
            params.push(fecha_salida);
        }

        // Nuevos filtros
        if (startDate && endDate) {
            baseQuery += ` AND b.${dateField} BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        if (createdAtStart && createdAtEnd) {
            baseQuery += " AND b.createdAt BETWEEN ? AND ?";
            params.push(createdAtStart, createdAtEnd);
        }

        if (personal_id) {
            baseQuery += " AND b.personal_id = ?";
            params.push(personal_id);
        }

        if (maquina_id) {
            baseQuery += " AND b.maquina_id = ?";
            params.push(maquina_id);
        }

        if (compania_id) {
            baseQuery += " AND b.compania_id = ?";
            params.push(compania_id);
        }

        if (clave_id) {
            baseQuery += " AND b.clave_id = ?";
            params.push(clave_id);
        }

        if (searchDireccion) {
            baseQuery += " AND b.direccion LIKE ?";
            params.push(`%${searchDireccion}%`);
        }

        // Filtros de carga de combustible y mantención
        if (isCargaCombustible !== undefined) {
            baseQuery += isCargaCombustible === "1" 
                ? " AND EXISTS (SELECT 1 FROM carga_combustible cc WHERE cc.bitacora_id = b.id)"
                : " AND NOT EXISTS (SELECT 1 FROM carga_combustible cc WHERE cc.bitacora_id = b.id)";
        }

        if (isMantencion !== undefined) {
            baseQuery += isMantencion === "1" 
                ? " AND EXISTS (SELECT 1 FROM mantencion m WHERE m.bitacora_id = b.id)"
                : " AND NOT EXISTS (SELECT 1 FROM mantencion m WHERE m.bitacora_id = b.id)";
        }

        if (disponible !== undefined) {
            const dispValue = parseInt(disponible);
            if (!isNaN(dispValue)) {
                baseQuery += ` AND b.disponible = ?`;
                params.push(dispValue);
            }
        }

        // Obtener el total de registros filtrados
        const countQuery = baseQuery.replace(/SELECT[\s\S]*?FROM/i, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await pool.query(countQuery, params);
        const totalRecords = countResult[0]?.total || 0;

        // Añadir ordenamiento y paginación a la consulta final
        baseQuery += ` ORDER BY ${finalOrderBy} ${finalOrderDirection}`;

        if (usePagination) {
            baseQuery += " LIMIT ? OFFSET ?";
            params.push(itemsPerPage, offset);
        }

        // Ejecutar la consulta final
        const [rows] = await pool.query(baseQuery, params);

        // Calcular totalPages
        const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));

        // Construir la respuesta
        res.json({
            pagination: {
                totalRecords,
                currentPage,
                pageSize: itemsPerPage,
                totalPages
            },
            data: rows
        });

    } catch (error) {
        console.error('Error en getBitacora:', error);
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
                    b.personal_id ,
                    CONCAT(p.nombre, ' ', p.apellido) AS 'conductor_nombre',
                    p.nombre as 'nombre_conductor',
                    p.apellido as 'apellido_conductor',
                    b.maquina_id,
                    m.codigo AS 'codigo_maquina',
                    m.patente AS 'patente_maquina',
                    b.clave_id,
                    cl.nombre AS clave,
                    b.direccion,
                    m.codigo AS 'codigo_maquina',
                    m.patente AS 'patente_maquina',
                    tm.nombre AS tipo_maquina, 
                    DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS fh_salida, 
                    DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS fh_llegada, 
                    cl.nombre AS clave, 
                    b.direccion, 
                    b.km_salida, 
                    b.km_llegada,
                    b.minutos_duracion,
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
                    b.createdAt as 'fecha_ingreso',
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
        compania_id,
        maquina_id,
        clave_id,
        personal_id,
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
    } = req.body;

    const errors = [];

    try {
        // Obtener el token y decodificarlo
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(403).json({ error: 'Token no proporcionado' });
        }

        // Decodificar el token
        const decoded = jwt.verify(token, process.env.SECRET_JWT_KEY);
        const { rol_personal, compania_id: tokenCompaniaId, personal_id: tokenPersonalId } = decoded;
        console.log(tokenCompaniaId, tokenPersonalId);
        // Validar campos obligatorios según el rol
        if (rol_personal === 'Maquinista' || rol_personal === 'Conductor Rentado') {
            // Para maquinistas, usar los datos del token
            compania_id = tokenCompaniaId;
            personal_id = tokenPersonalId;
        } else if (rol_personal === 'Capitan' || rol_personal === 'Teniente de Máquina') {
            // Para capitanes, usar la compañía del token
            compania_id = tokenCompaniaId;
        }

        // Validar campos obligatorios
        if (!compania_id) errors.push("ID de compañía es obligatorio");
        if (!personal_id) errors.push("ID de personal es obligatorio");
        if (!maquina_id) errors.push("ID de máquina es obligatorio");
        if (!f_salida || !h_salida) errors.push("Fecha y hora de salida son obligatorios");

        // Convertir IDs a números
        const companiaIdNumber = parseInt(compania_id);
        const maquinaIdNumber = parseInt(maquina_id);
        const personalIdNumber = parseInt(personal_id);
        const claveIdNumber = clave_id ? parseInt(clave_id) : null;

        if (isNaN(companiaIdNumber) || isNaN(maquinaIdNumber) || isNaN(personalIdNumber)) {
            errors.push("IDs inválidos");
        }

        // Validar que el conductor pertenezca a la compañía si no es TELECOM
        if (rol_personal !== 'TELECOM') {
            const [personalData] = await pool.query(
                "SELECT compania_id FROM personal WHERE id = ?",
                [personalIdNumber]
            );

            if (!personalData || personalData[0].compania_id !== companiaIdNumber) {
                errors.push("El conductor no pertenece a la compañía especificada");
            }
        }

        // Validar existencia en la base de datos
        await checkIfDeletedById(pool, companiaIdNumber, "compania", errors);
        await checkIfDeletedById(pool, personalIdNumber, "personal", errors);
        await checkIfDeletedById(pool, maquinaIdNumber, "maquina", errors);
        if (claveIdNumber) {
            await checkIfDeletedById(pool, claveIdNumber, "clave", errors);
        }

        // Si hay errores, retornar
        if (errors.length > 0) return res.status(400).json({ errors });

        // Obtener datos de la máquina si no se proporcionaron los valores de salida
        if (!km_salida || !hmetro_salida || !hbomba_salida) {
            const [maquinaData] = await pool.query(
                "SELECT kmetraje, hmetro_motor, hmetro_bomba FROM maquina WHERE id = ?",
                [maquinaIdNumber]
            );

            if (maquinaData && maquinaData[0]) {
                km_salida = km_salida || maquinaData[0].kmetraje;
                hmetro_salida = hmetro_salida || maquinaData[0].hmetro_motor;
                hbomba_salida = hbomba_salida || maquinaData[0].hmetro_bomba;
            }
        }

        // Procesar fechas y horas
        let fh_salida = null;
        let fh_llegada = null;
        let minutos_duracion = null;

        if (f_salida && h_salida) {
            const error = validateDate(f_salida, h_salida);
            if (error === false) errors.push("Fecha y hora de salida inválida");
            else fh_salida = formatDateTime(f_salida, h_salida);
        }

        if (f_llegada && h_llegada) {
            const error = validateDate(f_llegada, h_llegada);
            if (error === false) errors.push("Fecha y hora de llegada inválida");
            else fh_llegada = formatDateTime(f_llegada, h_llegada);
        }

        // Calcular minutos_duracion si ambas fechas están presentes
        if (fh_salida && fh_llegada) {
            const isValidStartEnd = validateStartEndDate(fh_salida, fh_llegada);
            if (!isValidStartEnd) {
                errors.push("La fecha de salida no puede ser posterior a la fecha de llegada");
            } else {
                const salida = new Date(fh_salida);
                const llegada = new Date(fh_llegada);
                minutos_duracion = Math.round((llegada - salida) / (1000 * 60));

                // Actualizar minutos conducidos del personal
                await pool.query(
                    "UPDATE personal SET minutosConducidos = COALESCE(minutosConducidos, 0) + ? WHERE id = ?",
                    [minutos_duracion, personalIdNumber]
                );
            }
        }

        // Validar longitud de la dirección
        if (direccion && direccion.length > 100) {
            errors.push("La dirección no puede tener más de 100 caracteres");
        }

        // Si hay errores después de todas las validaciones, retornar
        if (errors.length > 0) return res.status(400).json({ errors });

        // Insertar en la base de datos
        const [rows] = await pool.query(
            `INSERT INTO bitacora (
                compania_id,
                personal_id,
                maquina_id,
                clave_id,
                direccion,
                fh_salida,
                fh_llegada,
                km_salida,
                km_llegada,
                hmetro_salida,
                hmetro_llegada,
                hbomba_salida,
                hbomba_llegada,
                obs,
                minutos_duracion,
                isDeleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                companiaIdNumber,
                personalIdNumber,
                maquinaIdNumber,
                claveIdNumber,
                direccion || null,
                fh_salida,
                fh_llegada,
                km_salida || null,
                km_llegada || null,
                hmetro_salida || null,
                hmetro_llegada || null,
                hbomba_salida || null,
                hbomba_llegada || null,
                obs || null,
                minutos_duracion || null,
                0
            ]
        );

        // Actualizar datos de la máquina si se proporcionaron valores de llegada
        if (km_llegada || hmetro_llegada || hbomba_llegada) {
            await pool.query(
                `UPDATE maquina 
                SET 
                    kmetraje = COALESCE(?, kmetraje),
                    hmetro_motor = COALESCE(?, hmetro_motor),
                    hmetro_bomba = COALESCE(?, hmetro_bomba)
                WHERE id = ?`,
                [km_llegada, hmetro_llegada, hbomba_llegada, maquinaIdNumber]
            );
        }

        // Actualizar ultima_fec_servicio del personal si hay fecha de llegada
        if (fh_llegada) {
            // Verificar si esta es la última fecha de servicio para el personal
            const [ultimasFechas] = await pool.query(
                "SELECT MAX(fh_llegada) as ultima_fecha FROM bitacora WHERE personal_id = ? AND isDeleted = 0",
                [personalIdNumber]
            );
            
            if (ultimasFechas[0]?.ultima_fecha) {
                const ultimaFecha = new Date(ultimasFechas[0].ultima_fecha);
                const fechaActual = new Date(fh_llegada);
                
                // Solo actualizar si esta fecha es posterior a la última registrada
                if (fechaActual >= ultimaFecha) {
                    await pool.query(
                        "UPDATE personal SET ultima_fec_servicio = ? WHERE id = ?",
                        [fh_llegada, personalIdNumber]
                    );
                }
            } else {
                // Si no hay fecha previa, actualizar de todos modos
                await pool.query(
                    "UPDATE personal SET ultima_fec_servicio = ? WHERE id = ?",
                    [fh_llegada, personalIdNumber]
                );
            }
        }

        // Responder con la bitácora creada
        res.status(201).json({
            id: rows.insertId,
            compania_id: companiaIdNumber,
            personal_id: personalIdNumber,
            maquina_id: maquinaIdNumber,
            clave_id: claveIdNumber,
            direccion: direccion || null,
            fh_salida,
            fh_llegada,
            km_salida: km_salida || null,
            km_llegada: km_llegada || null,
            hmetro_salida: hmetro_salida || null,
            hmetro_llegada: hmetro_llegada || null,
            hbomba_salida: hbomba_salida || null,
            hbomba_llegada: hbomba_llegada || null,
            obs: obs || null
        });
    } catch (error) {
        console.error('Error en createBitacora:', error);
        return res.status(500).json({ 
            message: "Error en la creación de la bitácora", 
            error: error.message 
        });
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
        const [current] = await pool.query(`
            SELECT b.*
            FROM bitacora b
            WHERE b.id = ? AND b.isDeleted = 0`, 
            [id]
        );
        
        if (current.length === 0) return res.status(404).json({ message: "Bitácora no encontrada o ya está eliminada" });
        
        const bitacoraActual = current[0];
        // Guardar los valores antiguos para calcular diferencias posteriormente
        const oldMinutosDuracion = bitacoraActual.minutos_duracion || 0;
        const oldPersonalId = bitacoraActual.personal_id;
        
        const updates = [];
        const values = [];
        let needToRecalculateMinutos = false;
        let newPersonalId = personal_id;

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

        // Verificar si hay cambios en las fechas
        if (f_salida !== undefined && h_salida !== undefined) {
            const fh_salida = `${f_salida} ${h_salida}`;
            if (!validateDate(f_salida, h_salida)) errors.push('El formato de la fecha o la hora de salida es inválido. Deben ser dd-mm-aaaa y HH:mm');
            else {
                transformedFhSalida = formatDateTime(f_salida, h_salida);
                if (transformedFhSalida) {
                    updates.push("fh_salida = ?");
                    values.push(transformedFhSalida);
                    needToRecalculateMinutos = true;
                } else {
                    errors.push('Fecha de salida no válida');
                }
            }
        } else if (bitacoraActual.fh_salida) {
            // Usar el valor actual si no se proporciona uno nuevo
            transformedFhSalida = bitacoraActual.fh_salida;
        }

        if (f_llegada !== undefined && h_llegada !== undefined) {
            if (!validateDate(f_llegada, h_llegada)) errors.push('El formato de la fecha o la hora de llegada es inválido. Deben ser dd-mm-aaaa y HH:mm');
            else {
                transformedFhLlegada = formatDateTime(f_llegada, h_llegada);
                if (transformedFhLlegada) {
                    updates.push("fh_llegada = ?");
                    values.push(transformedFhLlegada);
                    needToRecalculateMinutos = true;
                } else {
                    errors.push('Fecha de llegada no válida');
                }
            }
        } else if (bitacoraActual.fh_llegada) {
            // Usar el valor actual si no se proporciona uno nuevo
            transformedFhLlegada = bitacoraActual.fh_llegada;
        }

        // Calcular minutos_duracion si ambas fechas están presentes
        let minutosDuracion = null;
        if (transformedFhSalida && transformedFhLlegada && needToRecalculateMinutos) {
            try {
                const isValidStartEnd = validateStartEndDate(transformedFhSalida, transformedFhLlegada);
                if (!isValidStartEnd) errors.push('La fecha de salida no puede ser posterior a la fecha de llegada');
                else {
                    // Calcular diferencia en minutos
                    const salida = new Date(transformedFhSalida);
                    const llegada = new Date(transformedFhLlegada);
                    minutosDuracion = Math.round((llegada - salida) / (1000 * 60));
                    
                    updates.push("minutos_duracion = ?");
                    values.push(minutosDuracion);
                }
            } catch (err) {
                errors.push(err.message);
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
                newPersonalId = personal_id;
            }
        } else {
            newPersonalId = oldPersonalId;
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

        // Actualizar minutos conducidos si hubo cambio en los minutos
        if (needToRecalculateMinutos && minutosDuracion !== null) {
            // Si el personal es el mismo, actualizamos los minutos
            if (oldPersonalId === newPersonalId) {
                // Restar los minutos antiguos y sumar los nuevos
                await pool.query(
                    "UPDATE personal SET minutosConducidos = COALESCE(minutosConducidos, 0) - ? + ? WHERE id = ?",
                    [oldMinutosDuracion, minutosDuracion, oldPersonalId]
                );
            } else {
                // Si cambió el personal, restar del antiguo
                if (oldPersonalId) {
                    await pool.query(
                        "UPDATE personal SET minutosConducidos = GREATEST(COALESCE(minutosConducidos, 0) - ?, 0) WHERE id = ?",
                        [oldMinutosDuracion, oldPersonalId]
                    );
                }
                // Y sumar al nuevo
                if (newPersonalId) {
                    await pool.query(
                        "UPDATE personal SET minutosConducidos = COALESCE(minutosConducidos, 0) + ? WHERE id = ?",
                        [minutosDuracion, newPersonalId]
                    );
                }
            }
        }

        // Actualizar ultima_fec_servicio del personal si hay fecha de llegada
        if (transformedFhLlegada && newPersonalId) {
            // Verificar si esta es la última fecha de servicio para el personal
            const [ultimasFechas] = await pool.query(
                "SELECT MAX(fh_llegada) as ultima_fecha FROM bitacora WHERE personal_id = ? AND isDeleted = 0",
                [newPersonalId]
            );
            
            if (ultimasFechas[0]?.ultima_fecha) {
                const ultimaFecha = new Date(ultimasFechas[0].ultima_fecha);
                const fechaActual = new Date(transformedFhLlegada);
                
                // Solo actualizar si esta fecha es posterior a la última registrada
                if (fechaActual >= ultimaFecha) {
                    await pool.query(
                        "UPDATE personal SET ultima_fec_servicio = ? WHERE id = ?",
                        [transformedFhLlegada, newPersonalId]
                    );
                }
            } else {
                // Si no hay fecha previa, actualizar de todos modos
                await pool.query(
                    "UPDATE personal SET ultima_fec_servicio = ? WHERE id = ?",
                    [transformedFhLlegada, newPersonalId]
                );
            }
        }

        // Devolver la bitácora actualizada
        const [updatedRows] = await pool.query(
            "SELECT * FROM bitacora WHERE id = ? AND isDeleted = 0", 
            [id]
        );
        
        res.json(updatedRows[0]);
    } catch (error) {
        console.error(error); // Para depuración
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

/*
    Crea e inicia la bitácora
*/
export const startServicio = async (req, res) => {
    try {
        console.log("Datos recibidos:", req.body);
        const { 
            compania_id,
            personal_id,
            maquina_id,
            f_salida, 
            h_salida,
            km_salida,
            hmetro_salida,
            hbomba_salida,
            direccion,
            clave_id,
            obs
        } = req.body;

        const errors = [];

        // Validar campos obligatorios
        try {
            if (!compania_id) errors.push("El ID de compañía es obligatorio.");
            if (!personal_id) errors.push("El ID de personal es obligatorio.");
            if (!maquina_id) errors.push("El ID de máquina es obligatorio.");
            if (!clave_id) errors.push("El ID de clave es obligatorio.");

            if (errors.length > 0) {
                console.log("Errores en campos obligatorios:", errors);
                return res.status(400).json({ errors });
            }
        } catch (validationError) {
            console.error("Error en validación de campos:", validationError);
            return res.status(400).json({ message: "Error en validación de campos", error: validationError.message });
        }

        // Convertir y validar IDs
        try {
            const companiaIdNum = parseInt(compania_id);
            const personalIdNum = parseInt(personal_id);
            const maquinaIdNum = parseInt(maquina_id);
            const claveIdNum = parseInt(clave_id);

            if (isNaN(companiaIdNum)) errors.push("ID de compañía inválido.");
            if (isNaN(personalIdNum)) errors.push("ID de personal inválido.");
            if (isNaN(maquinaIdNum)) errors.push("ID de máquina inválido.");
            if (isNaN(claveIdNum)) errors.push("ID de clave inválido.");

            if (errors.length > 0) {
                console.log("Errores en conversión de IDs:", errors);
                return res.status(400).json({ errors });
            }

            // Verificar existencia de entidades
            try {
                await checkIfDeletedById(pool, companiaIdNum, "compania", errors);
                await checkIfDeletedById(pool, personalIdNum, "personal", errors);
                await checkIfDeletedById(pool, maquinaIdNum, "maquina", errors);
                await checkIfDeletedById(pool, claveIdNum, "clave", errors);

                if (errors.length > 0) {
                    console.log("Errores en verificación de existencia:", errors);
                    return res.status(400).json({ errors });
                }

                // Obtener datos de la máquina
                try {
                    const [maquina] = await pool.query(
                        "SELECT bomba, kmetraje, hmetro_motor, hmetro_bomba FROM maquina WHERE id = ? AND isDeleted = 0",
                        [maquinaIdNum]
                    );

                    if (maquina.length === 0) {
                        console.log("Máquina no encontrada:", maquinaIdNum);
                        return res.status(404).json({ message: "Máquina no encontrada o eliminada." });
                    }

                    const { bomba, kmetraje, hmetro_motor, hmetro_bomba } = maquina[0];

                    // Verificar disponibilidad
                    try {
                        const query = `
                            SELECT
                                (SELECT disponible FROM maquina WHERE id = ? AND isDeleted = 0) AS maquinaDisponible,
                                (SELECT disponible FROM personal WHERE id = ? AND isDeleted = 0) AS personalDisponible
                        `;

                        const [result] = await pool.query(query, [maquinaIdNum, personalIdNum]);

                        if (!result[0]?.maquinaDisponible || result[0].maquinaDisponible !== 1) {
                            console.log("Máquina no disponible:", maquinaIdNum);
                            errors.push("La máquina no está disponible.");
                        }
                        if (!result[0]?.personalDisponible || result[0].personalDisponible !== 1) {
                            console.log("Personal no disponible:", personalIdNum);
                            errors.push("El personal no está disponible.");
                        }

                        if (errors.length > 0) return res.status(400).json({ errors });

                        // Procesar valores numéricos
                        try {
                            const kmSalidaFinal = km_salida !== undefined ? parseFloat(km_salida) : kmetraje;
                            const hmetroSalidaFinal = hmetro_salida !== undefined ? parseFloat(hmetro_salida) : hmetro_motor;
                            const hbombaSalidaFinal = bomba === 1 ? (hbomba_salida !== undefined ? parseFloat(hbomba_salida) : hmetro_bomba) : null;

                            if (kmSalidaFinal !== undefined && isNaN(kmSalidaFinal)) {
                                console.log("Error en km_salida:", km_salida);
                                return res.status(400).json({ message: "Valor inválido para kilómetros de salida" });
                            }

                            // Validar fecha y hora
                            let fhSalida;
                            try {
                                if (f_salida && h_salida) {
                                    const error = validateDate(f_salida, h_salida);
                                    if (error === false) {
                                        console.log("Fecha/hora inválida:", { f_salida, h_salida });
                                        return res.status(400).json({ message: "Fecha y hora de salida inválida" });
                                    }
                                    fhSalida = formatDateTime(f_salida, h_salida);
                                } else {
                                    fhSalida = new Date().toISOString().slice(0, 19).replace('T', ' ');
                                }

                                // Insertar bitácora
                                const [result2] = await pool.query(
                                    `INSERT INTO bitacora (
                                        compania_id, personal_id, maquina_id, clave_id,
                                        direccion, fh_salida, km_salida, hmetro_salida, 
                                        hbomba_salida, obs, enCurso, isDeleted
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [
                                        companiaIdNum, personalIdNum, maquinaIdNum, claveIdNum,
                                        direccion || null, fhSalida, kmSalidaFinal, hmetroSalidaFinal,
                                        hbombaSalidaFinal, obs || null, 1, 0
                                    ]
                                );

                                // Actualizar disponibilidad
                                await pool.query("UPDATE maquina SET disponible = 0 WHERE id = ?", [maquinaIdNum]);
                                await pool.query("UPDATE personal SET disponible = 0 WHERE id = ?", [personalIdNum]);

                                res.status(201).json({ 
                                    id: result2.insertId,
                                    message: "Servicio iniciado correctamente." 
                                });
                            } catch (dateError) {
                                console.error("Error procesando fecha/hora:", dateError);
                                return res.status(400).json({ message: "Error procesando fecha y hora", error: dateError.message });
                            }
                        } catch (numericError) {
                            console.error("Error procesando valores numéricos:", numericError);
                            return res.status(400).json({ message: "Error procesando valores numéricos", error: numericError.message });
                        }
                    } catch (disponibilidadError) {
                        console.error("Error verificando disponibilidad:", disponibilidadError);
                        return res.status(500).json({ message: "Error verificando disponibilidad", error: disponibilidadError.message });
                    }
                } catch (maquinaError) {
                    console.error("Error obteniendo datos de máquina:", maquinaError);
                    return res.status(500).json({ message: "Error obteniendo datos de máquina", error: maquinaError.message });
                }
            } catch (existenciaError) {
                console.error("Error verificando existencia de entidades:", existenciaError);
                return res.status(500).json({ message: "Error verificando existencia de entidades", error: existenciaError.message });
            }
        } catch (idError) {
            console.error("Error procesando IDs:", idError);
            return res.status(400).json({ message: "Error procesando IDs", error: idError.message });
        }
    } catch (error) {
        console.error("Error general en startServicio:", error);
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
            "SELECT personal_id, maquina_id, km_salida, hmetro_salida, hbomba_salida, enCurso, fh_salida FROM bitacora WHERE id = ? AND isDeleted = 0",
            [id]
        );

        if (bitacora.length === 0) {
            return res.status(404).json({ message: "Bitácora no encontrada o eliminada." });
        }

        const { personal_id, maquina_id, km_salida, hmetro_salida, hbomba_salida, enCurso, fh_salida } = bitacora[0];

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

        // Calcular minutos_duracion
        let minutosDuracion = null;
        if (fh_salida && mysqlFechaHora) {
            const salida = new Date(fh_salida);
            const llegada = new Date(mysqlFechaHora);
            minutosDuracion = Math.round((llegada - salida) / (1000 * 60));
        }

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
        
        if (minutosDuracion !== null) {
            updateFields.push('minutos_duracion = ?');
            updateValues.push(minutosDuracion);
        }
        
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
        if (mysqlFechaHora) {
            // Verificar si esta es la última fecha de servicio para el personal
            const [ultimasFechas] = await pool.query(
                "SELECT MAX(fh_llegada) as ultima_fecha FROM bitacora WHERE personal_id = ? AND isDeleted = 0",
                [personal_id]
            );
            
            if (ultimasFechas[0]?.ultima_fecha) {
                const ultimaFecha = new Date(ultimasFechas[0].ultima_fecha);
                const fechaActual = new Date(mysqlFechaHora);
                
                // Solo actualizar si esta fecha es posterior a la última registrada
                if (fechaActual >= ultimaFecha) {
                    await pool.query(
                        "UPDATE personal SET ultima_fec_servicio = ? WHERE id = ?",
                        [mysqlFechaHora, personal_id]
                    );
                }
            } else {
                // Si no hay fecha previa, actualizar de todos modos
                await pool.query(
                    "UPDATE personal SET ultima_fec_servicio = ? WHERE id = ?",
                    [mysqlFechaHora, personal_id]
                );
            }
        }

        // Actualizar minutos conducidos del personal si hay minutos_duracion
        if (minutosDuracion !== null) {
            await pool.query(
                "UPDATE personal SET minutosConducidos = COALESCE(minutosConducidos, 0) + ? WHERE id = ?",
                [minutosDuracion, personal_id]
            );
        }
        
        res.json({ message: "Servicio finalizado correctamente." });
    } catch (error) {
        return res.status(500).json({ message: "Error en la finalización del servicio", error: error.message });
    }
};

/* Función que inicia un servicio en una bitácora, validando los datos de salida (fecha, hora), 
verificando la disponibilidad de la máquina y el personal, y actualizando la bitácora y la disponibilidad en la base de datos.
*/
export const startServicioOld = async (req, res) => {
    const { id } = req.params;
    const { f_salida, h_salida } = req.body;

    // Validaciones de formato
    if (!f_salida || !h_salida) return res.status(400).json({ errors: ["Fecha y Hora de salida son requeridos."] });

    const dateError = validateDate(f_salida, h_salida);
    if (dateError === false) return res.status(400).json({ errors: ["Fecha y hora de salida inválida."] });
    

    try {
        // Verificar existencia de la bitácora y obtener personal_id y maquina_id
        const [bitacora] = await pool.query(
            "SELECT personal_id, maquina_id FROM bitacora WHERE id = ? AND isDeleted = 0",
            [id]
        );

        if (bitacora.length === 0) return res.status(404).json({ message: "Bitácora no encontrada o eliminada." });
        
        const { personal_id, maquina_id } = bitacora[0];

        // Obtener datos de la máquina
        const [maquina] = await pool.query("SELECT hmetro_bomba, hmetro_motor, kmetraje FROM maquina WHERE id = ?", [maquina_id]);
        if (maquina.length === 0) return res.status(404).json({ message: "Máquina no encontrada." });

        const { hmetro_bomba, hmetro_motor, kmetraje } = maquina[0];

        // Verificar disponibilidad de máquina y personal en una sola consulta
        const query = `
            SELECT
                (SELECT disponible FROM maquina WHERE id = ? AND isDeleted = 0) AS maquinaDisponible,
                (SELECT disponible FROM personal WHERE id = ? AND isDeleted = 0) AS personalDisponible
        `;
        const [result] = await pool.query(query, [maquina_id, personal_id]);

        const errors = [];
        if (!result[0]?.maquinaDisponible) errors.push("La máquina no está disponible.");
        if (personal_id !== null && !result[0]?.personalDisponible) errors.push("El personal no está disponible.");

        if (errors.length > 0) return res.status(400).json({ errors });
        
        // Transformar la fecha y hora a formato MySQL
        const mysqlFechaHora = formatDateTime(f_salida, h_salida);
        if (!mysqlFechaHora) return res.status(400).json({ message: "Fecha y hora de salida no son válidas." });

        // Actualizar datos en la bitácora
        await pool.query(
            `UPDATE bitacora SET 
                fh_salida = ?, 
                km_salida = ?, 
                hmetro_salida = ?, 
                hbomba_salida = ? 
            WHERE id = ?`,
            [mysqlFechaHora, kmetraje, hmetro_motor, hmetro_bomba, id]
        );

        // Actualizar disponibilidad de personal y máquina
        await Promise.all([
            pool.query("UPDATE maquina SET disponible = 0 WHERE id = ?", [maquina_id]),
            personal_id ? pool.query("UPDATE personal SET disponible = 0 WHERE id = ?", [personal_id]) : Promise.resolve()
        ]);

        res.json({ message: "Bitácora iniciada correctamente." });
    } catch (error) {
        return res.status(500).json({ message: "Error al iniciar el servicio", error: error.message });
    }
};

export const updateBitacorasDisponibilidad = async (req, res) => {
    try {
        console.log("Iniciando actualización de disponibilidad de bitácoras");
        
        // Primero verificamos cuántas bitácoras necesitan ser actualizadas
        const [checkResult] = await pool.query(
            `SELECT COUNT(*) as total 
             FROM bitacora b 
             WHERE b.id IN (
                SELECT DISTINCT bitacora_id 
                FROM (
                    SELECT bitacora_id FROM mantencion WHERE bitacora_id IS NOT NULL
                    UNION 
                    SELECT bitacora_id FROM carga_combustible WHERE bitacora_id IS NOT NULL
                ) AS subquery
             )
             AND (b.disponible IS NULL OR b.disponible = 1)
             AND b.isDeleted = 0`
        );
        
        console.log("Bitácoras que necesitan actualización:", checkResult[0].total);
        
        // Consulta para actualizar las bitácoras que tienen registros en mantencion o carga_combustible
        const [result] = await pool.query(
            `UPDATE bitacora b 
             SET b.disponible = 0 
             WHERE b.id IN (
                SELECT DISTINCT bitacora_id 
                FROM (
                    SELECT bitacora_id FROM mantencion WHERE bitacora_id IS NOT NULL
                    UNION 
                    SELECT bitacora_id FROM carga_combustible WHERE bitacora_id IS NOT NULL
                ) AS subquery
             )
             AND (b.disponible IS NULL OR b.disponible = 1)
             AND b.isDeleted = 0`
        );

        // Verificar lo que queda después de la actualización
        const [afterUpdateCheck] = await pool.query(
            `SELECT COUNT(*) as remaining 
             FROM bitacora b 
             WHERE b.id IN (
                SELECT DISTINCT bitacora_id 
                FROM (
                    SELECT bitacora_id FROM mantencion WHERE bitacora_id IS NOT NULL
                    UNION 
                    SELECT bitacora_id FROM carga_combustible WHERE bitacora_id IS NOT NULL
                ) AS subquery
             )
             AND (b.disponible IS NULL OR b.disponible = 1)
             AND b.isDeleted = 0`
        );
        
        console.log("Bitácoras restantes después de la actualización:", afterUpdateCheck[0].remaining);
        console.log("Filas afectadas según MySQL:", result.affectedRows);

        if (result.affectedRows > 0) {
            return res.json({ 
                message: "Disponibilidad de bitácoras actualizada correctamente",
                bitacorasActualizadas: result.affectedRows,
                totalEncontradas: checkResult[0].total,
                restantes: afterUpdateCheck[0].remaining
            });
        } else {
            return res.json({ 
                message: "No se encontraron bitácoras para actualizar",
                totalEncontradas: checkResult[0].total,
                restantes: afterUpdateCheck[0].remaining
            });
        }
    } catch (error) {
        console.error("Error al actualizar disponibilidad de bitácoras:", error);
        return res.status(500).json({ 
            message: "Error al actualizar la disponibilidad de las bitácoras", 
            error: error.message 
        });
    }
};

export const updateMinutosDuracion = async (req, res) => {
    try {
        console.log("Iniciando actualización de minutos_duracion");
        
        // Primero verificamos cuántos registros necesitan ser actualizados
        const [checkResult] = await pool.query(
            `SELECT COUNT(*) as total 
             FROM bitacora 
             WHERE minutos_duracion IS NULL 
             AND fh_salida IS NOT NULL 
             AND fh_llegada IS NOT NULL 
             AND isDeleted = 0`
        );
        
        console.log("Registros que necesitan actualización:", checkResult[0].total);
        
        // Consulta para actualizar los minutos_duracion
        const [result] = await pool.query(
            `UPDATE bitacora 
             SET minutos_duracion = TIMESTAMPDIFF(MINUTE, fh_salida, fh_llegada)
             WHERE minutos_duracion IS NULL 
             AND fh_salida IS NOT NULL 
             AND fh_llegada IS NOT NULL 
             AND isDeleted = 0`
        );

        // Verificar lo que queda después de la actualización
        const [afterUpdateCheck] = await pool.query(
            `SELECT COUNT(*) as remaining 
             FROM bitacora 
             WHERE minutos_duracion IS NULL 
             AND fh_salida IS NOT NULL 
             AND fh_llegada IS NOT NULL 
             AND isDeleted = 0`
        );
        
        console.log("Registros restantes después de la actualización:", afterUpdateCheck[0].remaining);
        console.log("Filas afectadas según MySQL:", result.affectedRows);

        if (result.affectedRows > 0) {
            return res.json({ 
                message: "Minutos de duración actualizados correctamente",
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
        console.error("Error al actualizar minutos de duración:", error);
        return res.status(500).json({ 
            message: "Error al actualizar los minutos de duración", 
            error: error.message 
        });
    }
};