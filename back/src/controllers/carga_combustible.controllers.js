import { pool } from "../db.js";

// Obtener todas las cargas de combustible
export const getCargasCombustible = async (req, res) => {
    try {
        const query = `
            SELECT cc.id, cc.maquina_id, cc.litros, cc.valor_mon, cc.isDeleted,
                   m.codigo, m.patente
            FROM carga_combustible cc
            INNER JOIN maquina m ON cc.maquina_id = m.id
            WHERE cc.isDeleted = 0
        `;
        
        const [rows] = await pool.query(query);
        res.json(rows);
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
            SELECT cc.id, cc.maquina_id, cc.litros, cc.valor_mon, cc.isDeleted,
                   m.codigo, m.patente
            FROM carga_combustible cc
            INNER JOIN maquina m ON cc.maquina_id = m.id
            WHERE cc.id = ? AND cc.isDeleted = 0
        `;

        const [rows] = await pool.query(query, [idNumber]);
        if (rows.length <= 0) {
            return res.status(404).json({ message: 'Carga de combustible no encontrada' });
        }
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
}

// Crear una nueva carga de combustible
export const createCargaCombustible = async (req, res) => {
    const { maquina_id, litros, valor_mon } = req.body;

    try {
        const maquinaIdNumber = parseInt(maquina_id);

        // Validar existencia de la máquina
        const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquinaIdNumber]);
        if (maquinaExists.length === 0) {
            return res.status(400).json({ message: 'Máquina no existe o está eliminada' });
        }

        if (isNaN(maquinaIdNumber) || typeof litros !== 'number' || typeof valor_mon !== 'number') {
            return res.status(400).json({ message: 'Tipo de datos inválido' });
        }

        const [rows] = await pool.query(
            'INSERT INTO carga_combustible (maquina_id, litros, valor_mon, isDeleted) VALUES (?, ?, ?, 0)',
            [maquinaIdNumber, litros, valor_mon]
        );

        return res.status(201).json({
            id: rows.insertId,
            maquina_id: maquinaIdNumber,
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
}

// Actualizar una carga de combustible
export const updateCargaCombustible = async (req, res) => {
    const { id } = req.params;
    const { maquina_id, litros, valor_mon } = req.body;

    try {
        const idNumber = parseInt(id);
        const maquinaIdNumber = parseInt(maquina_id);

        // Validar existencia de la máquina si se proporciona
        if (maquina_id !== undefined) {
            const [maquinaExists] = await pool.query("SELECT 1 FROM maquina WHERE id = ? AND isDeleted = 0", [maquinaIdNumber]);
            if (maquinaExists.length === 0) {
                return res.status(400).json({ message: 'Máquina no existe o está eliminada' });
            }
        }

        if (isNaN(maquinaIdNumber) && maquina_id !== undefined) {
            return res.status(400).json({ message: 'Tipo de datos inválido para máquina' });
        }

        // Validar litros y valor_mon
        if (litros !== undefined && typeof litros !== 'number') {
            return res.status(400).json({ message: 'Tipo de datos inválido para litros' });
        }
        if (valor_mon !== undefined && typeof valor_mon !== 'number') {
            return res.status(400).json({ message: 'Tipo de datos inválido para valor_mon' });
        }

        const [result] = await pool.query('UPDATE carga_combustible SET ' +
            'maquina_id = IFNULL(?, maquina_id), ' +
            'litros = IFNULL(?, litros), ' +
            'valor_mon = IFNULL(?, valor_mon) ' +
            'WHERE id = ?', [
                maquinaIdNumber,
                litros,
                valor_mon,
                idNumber
            ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Carga de combustible no encontrada' });
        }

        const [rows] = await pool.query('SELECT * FROM carga_combustible WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};
