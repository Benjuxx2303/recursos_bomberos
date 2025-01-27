import { pool } from "../db.js";
import {
    uploadFileToS3
} from '../utils/fileUpload.js';
import { validateDate, validateFloat, validateStartEndDate } from "../utils/validations.js";


// Obtener todas las cargas de combustible
export const getCargasCombustible = async (req, res) => {
    try {
        const query = `
            SELECT cc.id, cc.bitacora_id, cc.litros, cc.valor_mon, cc.img_url, cc.isDeleted,
                   b.compania_id, c.nombre as compania, 
                   p.rut as conductor_rut, p.nombre as conductor_nombre, p.apellido as conductor_apellido,
                   b.direccion, 
                   DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') as h_salida,
                   DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') as h_llegada
            FROM carga_combustible cc
            INNER JOIN bitacora b ON cc.bitacora_id = b.id
            INNER JOIN compania c ON b.compania_id = c.id
            INNER JOIN personal p ON b.personal_id = p.id
            WHERE cc.isDeleted = 0
        `;
        
        const [rows] = await pool.query(query);
        const result = rows.map(row => ({
            id: row.id,
            bitacora: {
                id: row.bitacora_id,
                compania: row.compania,
                conductor_rut: row.conductor_rut,
                conductor_nombre: row.conductor_nombre,
                conductor_apellido: row.conductor_apellido,
                direccion: row.direccion,
                h_salida: row.h_salida,
                h_llegada: row.h_llegada,
            },
            litros: row.litros,
            valor_mon: row.valor_mon,
            img_url: row.img_url,
        }));
        res.json(result);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// con parámetros de búsqueda 
// Paginacion
export const getCargaCombustibleDetailsSearch = async (req, res) => {
    try {
        const { page, pageSize } = req.query;

        // Inicializar la consulta SQL base
        let query = `
            SELECT
                cc.id AS 'id',
                b.id AS 'bitacora.id',
                b.direccion AS 'bitacora.direccion',
                DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS 'bitacora.fh_salida',
                DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS 'bitacora.fh_llegada',
                b.km_salida AS 'bitacora.km_salida',
                b.km_llegada AS 'bitacora.km_llegada',
                b.hmetro_salida AS 'bitacora.hmetro_salida',
                b.hmetro_llegada AS 'bitacora.hmetro_llegada',
                b.hbomba_salida AS 'bitacora.hbomba_salida',
                b.hbomba_llegada AS 'bitacora.hbomba_llegada',
                b.obs AS 'bitacora.obs',
                cc.litros,
                cc.valor_mon,
                cc.img_url
            FROM carga_combustible cc
            INNER JOIN bitacora b ON cc.bitacora_id = b.id
            WHERE cc.isDeleted = 0 AND b.isDeleted = 0
        `;

        // Array para almacenar los parámetros a inyectar
        const params = [];

        // Si se proporciona "page", se aplica paginación
        if (page) {
            const currentPage = parseInt(page) || 1; // Página actual, por defecto 1
            const currentPageSize = parseInt(pageSize) || 10; // Página tamaño, por defecto 10
            const offset = (currentPage - 1) * currentPageSize; // Calcular el offset para la consulta

            // Añadir LIMIT y OFFSET a la consulta
            query += ' LIMIT ? OFFSET ?';
            params.push(currentPageSize, offset);
        }

        query += " ORDER BY b.id DESC";

        // Ejecutar la consulta con los parámetros
        const [rows] = await pool.query(query, params);

        // Mapeo de resultados a la estructura deseada
        const result = rows.map(row => ({
            id: row.id,
            'bitacora.id': row['bitacora.id'],
            'bitacora.direccion': row['bitacora.direccion'],
            'bitacora.fh_salida': row['bitacora.fh_salida'],
            'bitacora.fh_llegada': row['bitacora.fh_llegada'],
            'bitacora.km_salida': row['bitacora.km_salida'],
            'bitacora.km_llegada': row['bitacora.km_llegada'],
            'bitacora.hmetro_salida': row['bitacora.hmetro_salida'],
            'bitacora.hmetro_llegada': row['bitacora.hmetro_llegada'],
            'bitacora.hbomba_salida': row['bitacora.hbomba_salida'],
            'bitacora.hbomba_llegada': row['bitacora.hbomba_llegada'],
            'bitacora.obs': row['bitacora.obs'],
            litros: row.litros,
            valor_mon: row.valor_mon,
            img_url: row.img_url
        }));

        // Responder con los resultados formateados
        res.json(result);

    } catch (error) {
        console.error('Error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message,
        });
    }
};

// Obtener carga de combustible por ID
export const getCargaCombustibleByID = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }

        const query = `
            SELECT 
                cc.id AS 'id',
                b.id AS 'bitacora.id',
                b.direccion AS 'bitacora.direccion',
                DATE_FORMAT(b.fh_salida, '%d-%m-%Y %H:%i') AS 'bitacora.fh_salida',
                DATE_FORMAT(b.fh_llegada, '%d-%m-%Y %H:%i') AS 'bitacora.fh_llegada',
                b.km_salida AS 'bitacora.km_salida',
                b.km_llegada AS 'bitacora.km_llegada',
                b.hmetro_salida AS 'bitacora.hmetro_salida',
                b.hmetro_llegada AS 'bitacora.hmetro_llegada',
                b.hbomba_salida AS 'bitacora.hbomba_salida',
                b.hbomba_llegada AS 'bitacora.hbomba_llegada',
                b.obs AS 'bitacora.obs',
                cc.litros,
                cc.valor_mon,
                cc.img_url
            FROM carga_combustible cc
            INNER JOIN bitacora b ON cc.bitacora_id = b.id
            WHERE cc.id = ? AND cc.isDeleted = 0
        `;

        const [rows] = await pool.query(query, [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({ message: 'Carga de combustible no encontrada' });
        }

        const row = rows[0];
        res.json({
            id: row.id,
            'bitacora.id': row['bitacora.id'],
            'bitacora.direccion': row['bitacora.direccion'],
            'bitacora.fh_salida': row['bitacora.fh_salida'],
            'bitacora.fh_llegada': row['bitacora.fh_llegada'],
            'bitacora.km_salida': row['bitacora.km_salida'],
            'bitacora.km_llegada': row['bitacora.km_llegada'],
            'bitacora.hmetro_salida': row['bitacora.hmetro_salida'],
            'bitacora.hmetro_llegada': row['bitacora.hmetro_llegada'],
            'bitacora.hbomba_salida': row['bitacora.hbomba_salida'],
            'bitacora.hbomba_llegada': row['bitacora.hbomba_llegada'],
            'bitacora.obs': row['bitacora.obs'],
            litros: row.litros,
            valor_mon: row.valor_mon,
            img_url: row.img_url,
        });
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};



// Crear una nueva carga de combustible
export const createCargaCombustible = async (req, res) => {
    try {
        const bitacoraId = req.body.bitacora_id;
        const litros = req.body.litros;
        const valorMon = req.body.valor_mon;

        // Convert and validate the numeric values
        const bitacoraIdNumber = parseInt(bitacoraId);
        const litrosNumber = parseFloat(litros);
        const valorMonNumber = parseFloat(valorMon);

        // Validate numeric conversions
        if (isNaN(bitacoraIdNumber) || isNaN(litrosNumber) || isNaN(valorMonNumber)) {
            return res.status(400).json({ 
                message: 'Tipo de datos inválido',
                details: 'Los campos bitacora_id, litros y valor_mon deben ser números válidos'
            });
        }

        // Validar existencia de la bitácora
        const [bitacoraExists] = await pool.query(
            "SELECT 1 FROM bitacora WHERE id = ? AND isDeleted = 0", 
            [bitacoraIdNumber]
        );
        
        if (bitacoraExists.length === 0) {
            return res.status(400).json({ message: 'Bitácora no existe o está eliminada' });
        }

        // Manejar la carga de archivos si existen
        let img_url = null;

        // Manejo de subida de imagen S3
        if (req.files && req.files.imagen && req.files.imagen[0]) {
            try {
                const imagen = req.files.imagen[0];
                const imgData = await uploadFileToS3(imagen, "carga_combustible");
                if (imgData && imgData.Location) {
                    img_url = imgData.Location;
                }
            } catch (error) {
                console.error('Error al subir imagen a S3:', error);
                return res.status(500).json({ 
                    message: 'Error al subir la imagen',
                    error: error.message 
                });
            }
        }

        const [rows] = await pool.query(
            'INSERT INTO carga_combustible (bitacora_id, litros, valor_mon, img_url, isDeleted) VALUES (?, ?, ?, ?, 0)',
            [bitacoraIdNumber, litrosNumber, valorMonNumber, img_url]
        );

        return res.status(201).json({
            id: rows.insertId,
            bitacora_id: bitacoraIdNumber,
            litros: litrosNumber,
            valor_mon: valorMonNumber,
            img_url
        });
    } catch (error) {
        console.error('Error en createCargaCombustible:', error);
        return res.status(500).json({ 
            message: 'Error interno del servidor',
            error: error.message 
        });
    }
};

export const createCargaCombustibleBitacora = async (req, res) => {
    let {
        "bitacora.compania_id": compania_id,
        "bitacora.personal_id": personal_id,
        "bitacora.maquina_id": maquina_id,
        "bitacora.direccion": direccion,
        "bitacora.f_salida": f_salida,
        "bitacora.h_salida": h_salida,
        "bitacora.f_llegada": f_llegada,
        "bitacora.h_llegada": h_llegada,
        "bitacora.clave_id": clave_id,
        "bitacora.km_salida": km_salida,
        "bitacora.km_llegada": km_llegada,
        "bitacora.hmetro_salida": hmetro_salida,
        "bitacora.hmetro_llegada": hmetro_llegada,
        "bitacora.hbomba_salida": hbomba_salida,
        "bitacora.hbomba_llegada": hbomba_llegada,
        "bitacora.obs": obs,
        litros,
        valor_mon
    } = req.body;

    const errors = []; // Arreglo para almacenar errores

    try {
        // Concatenar fecha y hora para formatear como datetime
        let fh_salida = null;
        let fh_llegada = null;

        // Validar fechas y horas de salida y llegada
        if (f_salida && h_salida) {
            const error = validateDate(f_salida, h_salida);
            // console.log(`Validando fh_salida: ${error}`);
            if (!error) {
                console.log(`${f_salida} ${h_salida}`);
                errors.push(`Fecha y hora de salida inválida: ${error}`);
            }
            fh_salida = `${f_salida} ${h_salida}`;
        }

        if (f_llegada && h_llegada) {
            const error = validateDate(f_llegada, h_llegada);
            // console.log(`Validando fh_llegada: ${error}`);
            if (!error) {
                errors.push(`Fecha y hora de llegada inválida: ${error}`);
            }
            fh_llegada = `${f_llegada} ${h_llegada}`;
        }

        // Validar que la fecha y hora de salida no sea posterior a la de llegada
        if (fh_salida && fh_llegada) {
            const error = validateStartEndDate(fh_salida, fh_llegada);
            if (!error) {
                errors.push(`Fecha y hora de salida no pueden ser posteriores a la fecha y hora de llegada`);
            }
        }

        // Validación de datos de la bitácora
        const companiaIdNumber = parseInt(compania_id);
        const personalIdNumber = parseInt(personal_id);
        const maquinaIdNumber = parseInt(maquina_id);
        const claveIdNumber = parseInt(clave_id);

        if (
            isNaN(companiaIdNumber) ||
            isNaN(personalIdNumber) ||
            typeof direccion !== "string" ||
            isNaN(claveIdNumber)
        ) {
            errors.push("Tipo de datos inválido en la bitácora");
        }

        // Manejar la carga de archivos si existen
        let img_url = null;

        // Manejo de subida de imagen S3
        if (req.files) {
            const imagen = req.files.imagen ? req.files.imagen[0] : null;

            if (imagen) {
                try {
                    const imgData = await uploadFileToS3(imagen, "carga_combustible");
                    if (imgData && imgData.Location) {
                        img_url = imgData.Location;
                    }
                } catch (error) {
                    errors.push("Error al subir la imagen", error.message);
                }
            }
        }

        // Validación de existencia de llaves foráneas para la bitácora
        const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [companiaIdNumber]);
        if (companiaExists.length === 0) {
            errors.push("Compañía no existe o está eliminada");
        }

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

        // validar compañia de la bitácora con la del personal
        const [companiaPersonal] = await pool.query("SELECT compania_id FROM personal WHERE id = ? AND compania_id = ? AND isDeleted = 0", [personalIdNumber, companiaIdNumber]);
        if (companiaPersonal.length === 0) {
            errors.push("Compania no coincide con la del personal");
        }

        // Validación de litros y valor monetario
        if (litros <= 0) {
            errors.push("Ingrese valor válido para 'litros'");
        }

        if (valor_mon <= 0) {
            errors.push("Ingrese valor válido para 'valor_mon'");
        }

        // Validación de km_salida, km_llegada, hmetro_salida, etc.
        const validateFields = [
            { field: km_salida, name: "km_salida" },
            { field: km_llegada, name: "km_llegada" },
            { field: hmetro_salida, name: "hmetro_salida" },
            { field: hmetro_llegada, name: "hmetro_llegada" },
            { field: hbomba_salida, name: "hbomba_salida" },
            { field: hbomba_llegada, name: "hbomba_llegada" }
        ];

        validateFields.forEach(({ field, name }) => {
            if (field === undefined || field === null) {
                errors.push(`${name} es obligatorio`);
            } else {
                const error = validateFloat(field);
                if (error) {
                    errors.push(`${name}: ${error}`);
                }
            }
        });

        // validar si personal_id es conductor (existe valor en 'ven_licencia')
        const [isConductor] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND ven_licencia IS NOT NULL", [personalIdNumber]);
        if (isConductor.length === 0) {
            errors.push("El personal seleccionado no es un conductor");
        }

        // validar si personal_id es conductor de la máquina 
        const [isConductorMaquina] = await pool.query("SELECT 1 FROM conductor_maquina WHERE personal_id = ? AND maquina_id = ?;", [personalIdNumber, maquinaIdNumber]);
        if (isConductorMaquina.length === 0) {
            errors.push("El personal seleccionado no es conductor de la máquina");
        }

        // Si hay errores, no ejecutar las queries
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Crear la bitácora
        const [bitacoraResult] = await pool.query(
            `INSERT INTO bitacora (
                compania_id, personal_id, maquina_id, direccion,
                fh_salida, fh_llegada, clave_id, km_salida, km_llegada,
                hmetro_salida, hmetro_llegada, hbomba_salida, hbomba_llegada, obs, isDeleted
            ) VALUES (?, ?, ?, ?, STR_TO_DATE(?, \'%d-%m-%Y %H:%i\'), STR_TO_DATE(?, \'%d-%m-%Y %H:%i\'), ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
                companiaIdNumber, personalIdNumber, maquinaIdNumber, direccion,
                fh_salida, fh_llegada, claveIdNumber,
                km_salida, km_llegada, hmetro_salida, hmetro_llegada,
                hbomba_salida, hbomba_llegada, obs || null
            ]
        );

        const bitacoraId = bitacoraResult.insertId;

        // Crear la carga de combustible
        const [cargaResult] = await pool.query(
            "INSERT INTO carga_combustible (bitacora_id, litros, valor_mon, img_url, isDeleted) VALUES (?, ?, ?, ?, 0)",
            [bitacoraId, litros, valor_mon, img_url]
        );

        return res.status(201).json({
            id: cargaResult.insertId,
            bitacora_id: bitacoraId,
            litros,
            valor_mon,
            img_url
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};


// Dar de baja una carga de combustible
export const downCargaCombustible = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }

        const [result] = await pool.query("UPDATE carga_combustible SET isDeleted = 1 WHERE id = ?", [idNumber]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Carga de combustible no encontrada' });
        }
        
        res.status(204).end();
    } catch (error) {
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

// Actualizar una carga de combustible
export const updateCargaCombustible = async (req, res) => {
    const { id } = req.params;
    let { 
        bitacora_id, 
        litros, 
        valor_mon 
    } = req.body;

    const errors = []; // Arreglo para capturar errores
    const updates = {}; // Objeto para almacenar los campos a actualizar

    try {
        const idNumber = parseInt(id);
        const bitacoraIdNumber = parseInt(bitacora_id);

        // Validar existencia de la bitácora si se proporciona
        if (bitacora_id !== undefined) {
            const [bitacoraExists] = await pool.query("SELECT 1 FROM bitacora WHERE id = ? AND isDeleted = 0", [bitacoraIdNumber]);
            if (bitacoraExists.length === 0) {
                errors.push('Bitácora no existe o está eliminada');
            }
        }

        if (isNaN(bitacoraIdNumber) && bitacora_id !== undefined) {
            errors.push('Tipo de datos inválido para bitácora');
        }

        // Validar litros (float)
        if (litros !== undefined) {
            const error = validateFloat(litros);
            if (error) {
                errors.push(`litros: ${error}`);
            } else {
                updates.litros = litros; // Solo agregar si es válido
            }
        }

        // Validar valor_mon (int)
        if (valor_mon !== undefined && typeof valor_mon !== 'number') {
            errors.push('Tipo de datos inválido para valor_mon');
        } else if (valor_mon !== undefined) {
            updates.valor_mon = valor_mon; // Solo agregar si es válido
        }

        // Manejo de carga de archivos si existen
        let img_url = null;

        // Manejo de subida de imagen S3
        if (req.files) {
            const imagen = req.files.imagen ? req.files.imagen[0] : null;

            if (imagen) {
                try {
                    const imgData = await uploadFileToS3(imagen, "carga_combustible");
                    if (imgData && imgData.Location) {
                        img_url = imgData.Location;
                        updates.img_url = img_url;
                    }
                } catch (error) {
                    errors.push("Error al subir la imagen", error.message);
                }
            }
        }

        // Si hay errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Si bitacora_id se proporciona, agregarla al objeto de actualizaciones
        if (bitacora_id !== undefined) {
            updates.bitacora_id = bitacoraIdNumber;
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

        // Ejecutar la consulta
        const [result] = await pool.query(`UPDATE carga_combustible SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Carga de Combustible no encontrada'
            });
        }

        // Recuperar los datos actualizados
        const [rows] = await pool.query('SELECT * FROM carga_combustible WHERE id = ?', [idNumber]);
        const row = rows[0];

        // Responder con los datos actualizados
        res.json({
            id: row.id,
            bitacora_id: row.bitacora_id,
            litros: row.litros,
            valor_mon: row.valor_mon,
            img_url: row.img_url,
        });
    } catch (error) {
        errors.push(error.message);
        return res.status(500).json({ message: 'Error interno del servidor', errors });
    }
};
