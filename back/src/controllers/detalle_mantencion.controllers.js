import { pool } from "../db.js";

// Obtener todos los detalles de mantención con joins
export const getDetallesMantencion = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT dm.*, 
                   m.ord_trabajo, 
                   tm.nombre AS tipo_mantencion, 
                   s.descripcion AS servicio
            FROM detalle_mantencion dm
            INNER JOIN mantencion m ON dm.mantencion_id = m.id
            INNER JOIN tipo_mantencion tm ON dm.tipo_mantencion_id = tm.id
            INNER JOIN servicio s ON dm.servicio_id = s.id
            WHERE dm.isDeleted = 0
        `);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// paginacion
export const getDetallesMantencionPage = async (req, res) => {
    try {
        // Obtener los parámetros de paginación
        const page = parseInt(req.query.page) || 1; // Página actual, por defecto es 1
        const pageSize = parseInt(req.query.pageSize) || 10; // Cantidad de registros por página, por defecto es 10

        // Calcular el offset
        const offset = (page - 1) * pageSize;

        // Si no se proporciona "page", devolver todos los datos sin paginación
        if (!req.query.page) {
            const query = `
                SELECT dm.*, 
                       m.ord_trabajo, 
                       tm.nombre AS tipo_mantencion, 
                       s.descripcion AS servicio
                FROM detalle_mantencion dm
                INNER JOIN mantencion m ON dm.mantencion_id = m.id
                INNER JOIN tipo_mantencion tm ON dm.tipo_mantencion_id = tm.id
                INNER JOIN servicio s ON dm.servicio_id = s.id
                WHERE dm.isDeleted = 0
            `;
            const [rows] = await pool.query(query);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Aplicar paginación
        const query = `
            SELECT dm.*, 
                   m.ord_trabajo, 
                   tm.nombre AS tipo_mantencion, 
                   s.descripcion AS servicio
            FROM detalle_mantencion dm
            INNER JOIN mantencion m ON dm.mantencion_id = m.id
            INNER JOIN tipo_mantencion tm ON dm.tipo_mantencion_id = tm.id
            INNER JOIN servicio s ON dm.servicio_id = s.id
            WHERE dm.isDeleted = 0
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.query(query, [pageSize, offset]);
        res.json(rows); // Devuelve los registros paginados

    } catch (error) {
        console.error('error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Obtener detalle de mantención por ID con joins
export const getDetalleMantencion = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }

        const [rows] = await pool.query(`
            SELECT dm.*, 
                   m.ord_trabajo, 
                   tm.nombre AS tipo_mantencion, 
                   s.descripcion AS servicio
            FROM detalle_mantencion dm
            INNER JOIN mantencion m ON dm.mantencion_id = m.id
            INNER JOIN tipo_mantencion tm ON dm.tipo_mantencion_id = tm.id
            INNER JOIN servicio s ON dm.servicio_id = s.id
            WHERE dm.id = ? AND dm.isDeleted = 0
        `, [idNumber]);

        if (rows.length <= 0) return res.status(404).json({ message: 'Detalle de mantención no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Obtener detalles de mantención por ID de mantención
export const getDetalleMantencionByMantencionID = async (req, res) => {
    const { mantencion_id } = req.params;

    try {
        const mantencionIdNumber = parseInt(mantencion_id);
        if (isNaN(mantencionIdNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }

        const [rows] = await pool.query(`
            SELECT dm.*, 
                   m.ord_trabajo, 
                   tm.nombre AS tipo_mantencion, 
                   s.descripcion AS servicio
            FROM detalle_mantencion dm
            INNER JOIN mantencion m ON dm.mantencion_id = m.id
            INNER JOIN tipo_mantencion tm ON dm.tipo_mantencion_id = tm.id
            INNER JOIN servicio s ON dm.servicio_id = s.id
            WHERE dm.mantencion_id = ? AND dm.isDeleted = 0
        `, [mantencionIdNumber]);

        if (rows.length <= 0) return res.status(404).json({ message: 'No se encontraron detalles de mantención para esta mantención' });
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};


// Crear un nuevo detalle de mantención
export const createDetalleMantencion = async (req, res) => {
    const { mantencion_id, tipo_mantencion_id, observacion, servicio_id } = req.body;
  
    // Arreglo para almacenar los errores
    const errors = [];
  
    try {
      // Validación de existencia de llaves foráneas
      if (isNaN(mantencion_id)) {
        errors.push("El 'mantencion_id' debe ser un número");
      } else {
        const [mantencionExists] = await pool.query("SELECT 1 FROM mantencion WHERE id = ? AND isDeleted = 0", [mantencion_id]);
        if (mantencionExists.length === 0) {
          errors.push("Mantención no existe o está eliminada");
        }
      }
  
      if (isNaN(tipo_mantencion_id)) {
        errors.push("El 'tipo_mantencion_id' debe ser un número");
      } else {
        const [tipoMantencionExists] = await pool.query("SELECT 1 FROM tipo_mantencion WHERE id = ? AND isDeleted = 0", [tipo_mantencion_id]);
        if (tipoMantencionExists.length === 0) {
          errors.push("Tipo de mantención no existe o está eliminado");
        }
      }
  
      if (isNaN(servicio_id)) {
        errors.push("El 'servicio_id' debe ser un número");
      } else {
        const [servicioExists] = await pool.query("SELECT 1 FROM servicio WHERE id = ? AND isDeleted = 0", [servicio_id]);
        if (servicioExists.length === 0) {
          errors.push("Servicio no existe o está eliminado");
        }
      }
  
      // Validación de tipo de datos
      if (observacion !== undefined && typeof observacion !== "string") {
        errors.push("El campo 'observacion' debe ser una cadena de texto");
      }
  
      // Si hay errores de validación, devolverlos
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }
  
      // Crear detalle de mantención (isDeleted = 0) por defecto
      const [rows] = await pool.query(`
        INSERT INTO detalle_mantencion (mantencion_id, tipo_mantencion_id, observacion, servicio_id, isDeleted) 
        VALUES (?, ?, ?, ?, 0)
      `, [mantencion_id, tipo_mantencion_id, observacion, servicio_id]);
  
      // Respuesta exitosa
      res.status(201).json({
        id: rows.insertId,
        mantencion_id,
        tipo_mantencion_id,
        observacion,
        servicio_id
      });
  
    } catch (error) {
      return res.status(500).json({
        message: "Error interno del servidor",
        error: error.message
      });
    }
  };
  
// Eliminar detalle de mantención
export const deleteDetalleMantencion = async (req, res) => {
    const { id } = req.params;

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ message: "Tipo de datos inválido" });
        }

        const [result] = await pool.query('UPDATE detalle_mantencion SET isDeleted = 1 WHERE id = ?', [idNumber]);
        if (result.affectedRows <= 0) return res.status(404).json({ message: 'Detalle de mantención no encontrado' });
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Actualizar detalle de mantención
export const updateDetalleMantencion = async (req, res) => {
    const { id } = req.params;
    const { mantencion_id, tipo_mantencion_id, observacion, servicio_id, isDeleted } = req.body;
  
    // Arreglo para almacenar los errores
    const errors = [];
  
    try {
      const idNumber = parseInt(id);
      if (isNaN(idNumber)) {
        errors.push("ID inválido");
      }
  
      const updates = {};
  
      // Validación de existencia de llaves foráneas
      if (mantencion_id !== undefined) {
        if (isNaN(mantencion_id)) {
          errors.push("El 'mantencion_id' debe ser un número");
        } else {
          const [mantencionExists] = await pool.query("SELECT 1 FROM mantencion WHERE id = ? AND isDeleted = 0", [mantencion_id]);
          if (mantencionExists.length === 0) {
            errors.push("Mantención no existe o está eliminada");
          } else {
            updates.mantencion_id = mantencion_id;
          }
        }
      }
  
      if (tipo_mantencion_id !== undefined) {
        if (isNaN(tipo_mantencion_id)) {
          errors.push("El 'tipo_mantencion_id' debe ser un número");
        } else {
          const [tipoMantencionExists] = await pool.query("SELECT 1 FROM tipo_mantencion WHERE id = ? AND isDeleted = 0", [tipo_mantencion_id]);
          if (tipoMantencionExists.length === 0) {
            errors.push("Tipo de mantención no existe o está eliminado");
          } else {
            updates.tipo_mantencion_id = tipo_mantencion_id;
          }
        }
      }
  
      if (observacion !== undefined) {
        if (typeof observacion !== "string") {
          errors.push("El campo 'observacion' debe ser una cadena de texto");
        } else {
          updates.observacion = observacion;
        }
      }
  
      if (servicio_id !== undefined) {
        if (isNaN(servicio_id)) {
          errors.push("El 'servicio_id' debe ser un número");
        } else {
          const [servicioExists] = await pool.query("SELECT 1 FROM servicio WHERE id = ? AND isDeleted = 0", [servicio_id]);
          if (servicioExists.length === 0) {
            errors.push("Servicio no existe o está eliminado");
          } else {
            updates.servicio_id = servicio_id;
          }
        }
      }
  
      if (isDeleted !== undefined) {
        if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
          errors.push("El valor de 'isDeleted' debe ser 0 o 1");
        } else {
          updates.isDeleted = isDeleted;
        }
      }
  
      // Si hay errores, devolverlos en la respuesta
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }
  
      // Construir la consulta de actualización
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
  
      if (!setClause) {
        return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
      }
  
      const values = Object.values(updates).concat(idNumber);
      const [result] = await pool.query(`UPDATE detalle_mantencion SET ${setClause} WHERE id = ?`, values);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Detalle de mantención no encontrado" });
      }
  
      // Recuperar y devolver el detalle actualizado
      const [rows] = await pool.query("SELECT * FROM detalle_mantencion WHERE id = ?", [idNumber]);
      res.json(rows[0]);
  
    } catch (error) {
      return res.status(500).json({
        message: "Error interno del servidor",
        error: error.message
      });
    }
  };
  
