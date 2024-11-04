import { pool } from "../db.js";
import {
    uploadFileToS3,
    updateImageUrlInDb,
    handleError
} from './fileUpload.js';


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
            INNER JOIN conductor_maquina cm ON b.conductor_id = cm.id
            INNER JOIN personal p ON cm.personal_id = p.id
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

// Obtener carga de combustible por ID
export const getCargaCombustibleByID = async (req, res) => {
    const { id } = req.params;
    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }

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
            INNER JOIN conductor_maquina cm ON b.conductor_id = cm.id
            INNER JOIN personal p ON cm.personal_id = p.id
            WHERE cc.id = ? AND cc.isDeleted = 0
        `;

        const [rows] = await pool.query(query, [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({ message: 'Carga de combustible no encontrada' });
        }

        const row = rows[0];
        res.json({
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
        });
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};



// Crear una nueva carga de combustible
export const createCargaCombustible = async (req, res) => {
    const { bitacora_id, litros, valor_mon } = req.body;

    try {
        const bitacoraIdNumber = parseInt(bitacora_id);

        // Validar existencia de la bitácora
        const [bitacoraExists] = await pool.query("SELECT 1 FROM bitacora WHERE id = ? AND isDeleted = 0", [bitacoraIdNumber]);
        if (bitacoraExists.length === 0) {
            return res.status(400).json({ message: 'Bitácora no existe o está eliminada' });
        }

        if (isNaN(bitacoraIdNumber) || typeof litros !== 'number' || typeof valor_mon !== 'number') {
            return res.status(400).json({ message: 'Tipo de datos inválido' });
        }

        const [rows] = await pool.query(
            'INSERT INTO carga_combustible (bitacora_id, litros, valor_mon, isDeleted) VALUES (?, ?, ?, 0)',
            [bitacoraIdNumber, litros, valor_mon]
        );

        return res.status(201).json({
            id: rows.insertId,
            bitacora_id: bitacoraIdNumber,
            litros,
            valor_mon
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
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
    const { bitacora_id, litros, valor_mon } = req.body;

    try {
        const idNumber = parseInt(id);
        const bitacoraIdNumber = parseInt(bitacora_id);

        // Validar existencia de la bitácora si se proporciona
        if (bitacora_id !== undefined) {
            const [bitacoraExists] = await pool.query("SELECT 1 FROM bitacora WHERE id = ? AND isDeleted = 0", [bitacoraIdNumber]);
            if (bitacoraExists.length === 0) {
                return res.status(400).json({ message: 'Bitácora no existe o está eliminada' });
            }
        }

        if (isNaN(bitacoraIdNumber) && bitacora_id !== undefined) {
            return res.status(400).json({ message: 'Tipo de datos inválido para bitácora' });
        }

        // Validar litros y valor_mon
        if (litros !== undefined && typeof litros !== 'number') {
            return res.status(400).json({ message: 'Tipo de datos inválido para litros' });
        }
        if (valor_mon !== undefined && typeof valor_mon !== 'number') {
            return res.status(400).json({ message: 'Tipo de datos inválido para valor_mon' });
        }

        const [result] = await pool.query('UPDATE carga_combustible SET ' +
            'bitacora_id = IFNULL(?, bitacora_id), ' +
            'litros = IFNULL(?, litros), ' +
            'valor_mon = IFNULL(?, valor_mon) ' +
            'WHERE id = ?', [
                bitacoraIdNumber,
                litros,
                valor_mon,
                idNumber
            ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Carga de combustible no encontrada' });
        }

        const [rows] = await pool.query('SELECT * FROM carga_combustible WHERE id = ?', [idNumber]);
        const row = rows[0];
        const bitacoraQuery = `
            SELECT id, compania_id, conductor_id, direccion, 
                   DATE_FORMAT(fh_salida, '%d-%m-%Y %H:%i') as h_salida,
                   DATE_FORMAT(fh_llegada, '%d-%m-%Y %H:%i') as h_llegada
            FROM bitacora WHERE id = ?`;
        const [bitacora] = await pool.query(bitacoraQuery, [row.bitacora_id]);

        res.json({
            id: row.id,
            bitacora: bitacora[0],
            litros: row.litros,
            valor_mon: row.valor_mon,
            img_url: row.img_url,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

const value = "carga_combustible";
const folder = value;
const tableName = value;

export const updateImage = async (req, res) => {
    const { id } = req.params;
    const file = req.file;

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