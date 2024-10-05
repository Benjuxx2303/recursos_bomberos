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
        obs, // Se incluye aquí, pero será opcional
    } = req.body;

    try {
        // Validación de datos
        const companiaIdNumber = parseInt(compania_id);
        const conductorIdNumber = parseInt(conductor_id);
        const claveIdNumber = parseInt(clave_id);
        
        // Verificar que los IDs sean válidos
        if (
            isNaN(companiaIdNumber) ||
            isNaN(conductorIdNumber) ||
            isNaN(claveIdNumber) ||
            typeof direccion !== 'string' // Asegurarse de que sea una cadena
        ) {
            return res.status(400).json({ message: 'Tipo de datos inválido' });
        }

        // Validación de existencia de llaves foráneas
        const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [companiaIdNumber]);
        if (companiaExists.length === 0) {
            return res.status(400).json({ message: "Compania no existe o está eliminada" });
        }

        const [conductorExists] = await pool.query("SELECT 1 FROM conductor_maquina WHERE id = ? AND isDeleted = 0", [conductorIdNumber]);
        if (conductorExists.length === 0) {
            return res.status(400).json({ message: "Conductor no existe o está eliminado" });
        }

        const [claveExists] = await pool.query("SELECT 1 FROM clave WHERE id = ? AND isDeleted = 0", [claveIdNumber]);
        if (claveExists.length === 0) {
            return res.status(400).json({ message: "Clave no existe o está eliminada" });
        }

        // Validación de fecha
        const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
        if (!fechaRegex.test(fecha)) {
            return res.status(400).json({
                message: 'El formato de la fecha es inválido. Debe ser dd-mm-aaaa'
            });
        }

        // Preparar el valor de obs; si es nulo o no viene, se omitirá
        const obsValue = obs || ''; // O también podrías usar '' si prefieres una cadena vacía

        // Inserción en la base de datos
        const [rows] = await pool.query(
            "INSERT INTO bitacora (compania_id, conductor_id, direccion, fecha, h_salida, h_llegada, clave_id, km_salida, km_llegada, hmetro_salida, hmetro_llegada, hbomba_salida, hbomba_llegada, obs, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)",
            [
                companiaIdNumber,
                conductorIdNumber,
                direccion,
                fecha,
                h_salida,
                h_llegada,
                claveIdNumber,
                km_salida,
                km_llegada,
                hmetro_salida,
                hmetro_llegada,
                hbomba_salida,
                hbomba_llegada,
                obsValue, // Se usa aquí el valor de obs
            ]
        );

        res.status(201).json({
            id: rows.insertId,
            compania_id: companiaIdNumber,
            conductor_id: conductorIdNumber,
            direccion,
            fecha,
            h_salida,
            h_llegada,
            clave_id: claveIdNumber,
            km_salida,
            km_llegada,
            hmetro_salida,
            hmetro_llegada,
            hbomba_salida,
            hbomba_llegada,
            obs: obsValue, // Se devuelve también en la respuesta
        });
    } catch (error) {
        console.error('Error: ', error);
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
        isDeleted,
    } = req.body;

    try {
        // Construir los campos de actualización
        const updates = {};
        if (direccion !== undefined) updates.direccion = direccion;

        // Validación de fecha
        const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
        if (fecha !== undefined) {
            if (!fechaRegex.test(fecha)) {
                return res.status(400).json({
                    message: 'El formato de la fecha es inválido. Debe ser dd-mm-aaaa'
                });
            }
            updates.fecha = fecha; // Guardamos la fecha en el objeto de actualizaciones
        }

        // Validación y asignación de tiempos
        if (h_salida !== undefined) updates.h_salida = h_salida;
        if (h_llegada !== undefined) updates.h_llegada = h_llegada;

        // Validación y asignación de floats
        const floatFields = ['km_salida', 'km_llegada', 'hmetro_salida', 'hmetro_llegada', 'hbomba_salida', 'hbomba_llegada'];
        for (const field of floatFields) {
            if (req.body[field] !== undefined) {
                const value = parseFloat(req.body[field]);
                if (isNaN(value)) {
                    return res.status(400).json({ message: `Tipo de dato inválido para '${field}'` });
                }
                updates[field] = value;
            }
        }

        // Validaciones de existencia solo si se proporcionan
        if (compania_id !== undefined) {
            const [companiaExists] = await pool.query("SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0", [compania_id]);
            if (companiaExists.length === 0) {
                return res.status(400).json({ message: "Compania no existe o está eliminada" });
            }
            updates.compania_id = compania_id;
        }

        if (conductor_id !== undefined) {
            const [conductorExists] = await pool.query("SELECT 1 FROM conductor_maquina WHERE id = ? AND isDeleted = 0", [conductor_id]);
            if (conductorExists.length === 0) {
                return res.status(400).json({ message: "Conductor no existe o está eliminado" });
            }
            updates.conductor_id = conductor_id;
        }

        if (clave_id !== undefined) {
            const [claveExists] = await pool.query("SELECT 1 FROM clave WHERE id = ? AND isDeleted = 0", [clave_id]);
            if (claveExists.length === 0) {
                return res.status(400).json({ message: "Clave no existe o está eliminada" });
            }
            updates.clave_id = clave_id;
        }

        // Validación y asignación de isDeleted
        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                return res.status(400).json({ message: "Tipo de dato inválido para 'isDeleted'" });
            }
            updates.isDeleted = isDeleted;
        }

        // Construir la consulta de actualización
        const setClause = Object.keys(updates)
            .map((key) => `${key} = ${key === 'fecha' ? 'STR_TO_DATE(?, "%d-%m-%Y")' : '?'}`)
            .join(", ");

        if (!setClause) {
            return res.status(400).json({
                message: "No se proporcionaron campos para actualizar"
            });
        }

        const values = Object.values(updates).concat(id);

        const [result] = await pool.query(
            `UPDATE bitacora SET ${setClause} WHERE id = ? AND isDeleted = 0`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Bitácora no encontrada o ya está eliminada" });
        }

        const [rows] = await pool.query("SELECT * FROM bitacora WHERE id = ? AND isDeleted = 0", [id]);
        res.json(rows[0]);
    } catch (error) {
        console.error(error); // Opcional: para depurar el error
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};

