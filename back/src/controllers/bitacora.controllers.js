import { pool } from "../db.js";

// Obtener todas las bitácoras
export const getBitacora = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT b.id, c.nombre AS compania, cm.personal_id, cm.maquina_id, cm.tipo_maquina_id, cl.codigo AS clave, b.direccion, b.h_salida, b.h_llegada, b.km_salida, b.km_llegada, b.hmetro_salida, b.hmetro_llegada, b.hbomba_salida, b.hbomba_llegada, b.obs 
             FROM bitacora b 
             INNER JOIN compania c ON b.compania_id = c.id AND c.isDeleted = 0
             INNER JOIN conductor_maquina cm ON b.conductor_id = cm.id AND cm.isDeleted = 0 
             INNER JOIN clave cl ON b.clave_id = cl.id AND cl.isDeleted = 0 
             WHERE b.isDeleted = 0`
        );
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
          `SELECT b.id, c.nombre AS compania, cm.personal_id, cm.maquina_id, cm.tipo_maquina_id, cl.codigo AS clave, b.direccion, b.h_salida, b.  h_llegada, b.km_salida, b.km_llegada, b.hmetro_salida, b.hmetro_llegada, b.hbomba_salida, b.hbomba_llegada, b.obs 
          FROM bitacora b 
          INNER JOIN compania c ON b.compania_id = c.id AND c.isDeleted = 0
          INNER JOIN conductor_maquina cm ON b.conductor_id = cm.id AND cm.isDeleted = 0 
          INNER JOIN clave cl ON b.clave_id = cl.id AND cl.isDeleted = 0 
          WHERE b.id = ? AND b.isDeleted = 0`,
          [id]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ message: "Bitácora no encontrada" });
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
        conductor_id,
        direccion,
        fecha,
        h_salida,
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
        // Validaciones
        const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [compania_id]);
        if (companiaExists.length === 0) {
            return res.status(400).json({ message: "Compania no existe o está eliminada" });
        }

        const [conductorExists] = await pool.query("SELECT 1 FROM conductor_maquina WHERE id = ? AND isDeleted = 0", [conductor_id]);
        if (conductorExists.length === 0) {
            return res.status(400).json({ message: "Conductor no existe o está eliminado" });
        }

        const [claveExists] = await pool.query("SELECT 1 FROM clave WHERE id = ? AND isDeleted = 0", [clave_id]);
        if (claveExists.length === 0) {
            return res.status(400).json({ message: "Clave no existe o está eliminada" });
        }

        // Inserción en la base de datos
        const [rows] = await pool.query(
            "INSERT INTO bitacora (compania_id, conductor_id, direccion, fecha, h_salida, h_llegada, clave_id, km_salida, km_llegada, hmetro_salida, hmetro_llegada, hbomba_salida, hbomba_llegada, obs, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)",
            [
                compania_id,
                conductor_id,
                direccion,
                fecha,
                h_salida,
                h_llegada,
                clave_id,
                km_salida,
                km_llegada,
                hmetro_salida,
                hmetro_llegada,
                hbomba_salida,
                hbomba_llegada,
                obs,
            ]
        );

        res.status(201).json({
            id: rows.insertId,
            compania_id,
            conductor_id,
            direccion,
            fecha,
            h_salida,
            h_llegada,
            clave_id,
            km_salida,
            km_llegada,
            hmetro_salida,
            hmetro_llegada,
            hbomba_salida,
            hbomba_llegada,
            obs,
        });
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor" });
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
      return res.status(500).json({ message: "Error interno del servidor" });
  }
};


// Actualizar una bitácora
export const updateBitacora = async (req, res) => {
    const { id } = req.params;
    const {
        compania_id,
        conductor_id,
        clave_id,
        direccion,
        fecha,
        h_salida,
        h_llegada,
        km_salida,
        km_llegada,
        hmetro_salida,
        hmetro_llegada,
        hbomba_salida,
        hbomba_llegada,
        obs,
    } = req.body;

    try {
        // Validaciones
        const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [compania_id]);
        if (companiaExists.length === 0) {
            return res.status(400).json({ message: "Compania no existe o está eliminada" });
        }

        const [conductorExists] = await pool.query("SELECT 1 FROM conductor_maquina WHERE id = ? AND isDeleted = 0", [conductor_id]);
        if (conductorExists.length === 0) {
            return res.status(400).json({ message: "Conductor no existe o está eliminado" });
        }

        const [claveExists] = await pool.query("SELECT 1 FROM clave WHERE id = ? AND isDeleted = 0", [clave_id]);
        if (claveExists.length === 0) {
            return res.status(400).json({ message: "Clave no existe o está eliminada" });
        }

        const [result] = await pool.query(
            "UPDATE bitacora SET direccion = IFNULL(?, direccion), fecha = IFNULL(?, fecha), h_salida = IFNULL(?, h_salida), h_llegada = IFNULL(?, h_llegada), km_salida = IFNULL(?, km_salida), km_llegada = IFNULL(?, km_llegada), hmetro_salida = IFNULL(?, hmetro_salida), hmetro_llegada = IFNULL(?, hmetro_llegada), hbomba_salida = IFNULL(?, hbomba_salida), hbomba_llegada = IFNULL(?, hbomba_llegada), obs = IFNULL(?, obs) WHERE id = ? AND isDeleted = 0",
            [
                direccion,
                fecha,
                h_salida,
                h_llegada,
                km_salida,
                km_llegada,
                hmetro_salida,
                hmetro_llegada,
                hbomba_salida,
                hbomba_llegada,
                obs,
                id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Bitácora no encontrada o ya está eliminada" });
        }

        const [rows] = await pool.query("SELECT * FROM bitacora WHERE id = ? AND isDeleted = 0", [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};
