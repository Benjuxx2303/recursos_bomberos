import { pool } from "../db.js";
import { uploadFileToS3 } from "../utils/fileUpload.js";

// Devuelve todos los modelos
export const getModelos = async (req, res) => {
  try {
    const query = `
            SELECT m.id, m.nombre, m.peso_kg , m.img_url, ma.id as marca_id,ma.nombre AS marca,t.id as tipo_maquina_id, t.nombre AS tipo_maquina, t.descripcion AS tipo_maquina_descripcion
      FROM modelo m
      JOIN marca ma ON m.marca_id = ma.id
      JOIN tipo_maquina t ON m.tipo_maquina_id = t.id
      WHERE m.isDeleted = 0
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Devuelve todos los modelos con paginación opcional
export const getModelosPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { marca_id, tipo_maquina_id } = req.query;

    const offset = (page - 1) * pageSize;
    let query = `
      SELECT m.id, m.nombre, m.peso_kg, m.img_url,
             ma.id as marca_id, ma.nombre AS marca,
             t.id as tipo_maquina_id, t.nombre AS tipo_maquina, 
             t.descripcion AS tipo_maquina_descripcion
      FROM modelo m
      JOIN marca ma ON m.marca_id = ma.id
      JOIN tipo_maquina t ON m.tipo_maquina_id = t.id
      WHERE m.isDeleted = 0
    `;

    const params = [];
    
    if (marca_id) {
      query += " AND m.marca_id = ?";
      params.push(marca_id);
    }
    
    if (tipo_maquina_id) {
      query += " AND m.tipo_maquina_id = ?";
      params.push(tipo_maquina_id);
    }

    // Consulta para obtener el total de registros
    const countQuery = query.replace(
      "SELECT m.id, m.nombre, m.peso_kg, m.img_url,\n             ma.id as marca_id, ma.nombre AS marca,\n             t.id as tipo_maquina_id, t.nombre AS tipo_maquina, \n             t.descripcion AS tipo_maquina_descripcion",
      "SELECT COUNT(*) as total"
    );
    
    const [totalCount] = await pool.query(countQuery, params);
    
    // Agregar paginación a la consulta principal
    query += " LIMIT ? OFFSET ?";
    params.push(pageSize, offset);

    const [rows] = await pool.query(query, params);

    res.json({
      data: rows,
      pagination: {
        page,
        pageSize,
        total: totalCount[0].total,
        totalPages: Math.ceil(totalCount[0].total / pageSize)
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Devuelve modelo por ID
export const getModeloById = async (req, res) => {
  const { id } = req.params;
  try {
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const query = `
            SELECT m.id, m.nombre, m.peso_kg , m.img_url,ma.nombre AS marca, t.nombre AS tipo_maquina, t.descripcion AS tipo_maquina_descripcion
            FROM modelo m
            JOIN marca ma ON m.marca_id = ma.id
            JOIN tipo_maquina t ON m.tipo_maquina_id = t.id
            WHERE m.id = ? AND m.isDeleted = 0
        `;
    const [rows] = await pool.query(query, [idNumber]);
    if (rows.length <= 0) {
      return res.status(404).json({
        message: "Modelo no encontrado",
      });
    }
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Crear modelo
export const createModelo = async (req, res) => {
  try {
    console.log('Body recibido:', req.body);
    console.log('Files recibidos:', req.files);

    // Validar campos requeridos
    if (!req.body.nombre || !req.body.marca_id || !req.body.tipo_maquina_id) {
      return res.status(400).json({
        message: "Los campos nombre, marca_id y tipo_maquina_id son requeridos"
      });
    }

    const nombre = req.body.nombre.trim();
    const marca_id = parseInt(req.body.marca_id);
    const tipo_maquina_id = parseInt(req.body.tipo_maquina_id);
    const peso_kg = req.body.peso_kg ? parseFloat(req.body.peso_kg) : null;
    let img_url = null;

    // Validaciones adicionales
    if (nombre === '') {
      return res.status(400).json({
        message: "El nombre no puede estar vacío"
      });
    }

    if (isNaN(marca_id) || marca_id <= 0) {
      return res.status(400).json({
        message: "ID de marca inválido"
      });
    }

    if (isNaN(tipo_maquina_id) || tipo_maquina_id <= 0) {
      return res.status(400).json({
        message: "ID de tipo de máquina inválido"
      });
    }

    if (req.body.peso_kg && isNaN(peso_kg)) {
      return res.status(400).json({
        message: "El peso debe ser un número válido"
      });
    }

    // Verificar que la marca existe
/*     const [marcaExists] = await pool.query(
      "SELECT id FROM marca WHERE id = ? AND isDeleted = 0",
      [marca_id]
    );

    if (marcaExists.length === 0) {
      return res.status(400).json({
        message: "La marca especificada no existe"
      });
    } */

    // Verificar que el tipo de máquina existe
    const [tipoExists] = await pool.query(
      "SELECT id FROM tipo_maquina WHERE id = ? AND isDeleted = 0",
      [tipo_maquina_id]
    );

    if (tipoExists.length === 0) {
      return res.status(400).json({
        message: "El tipo de máquina especificado no existe"
      });
    }

    // Manejar la carga de imágenes si existen
    if (req.files && req.files.imagen) {
      try {
        const imgData = await uploadFileToS3(req.files.imagen[0], "maquina");
        if (imgData && imgData.Location) {
          img_url = imgData.Location;
        }
      } catch (error) {
        console.error('Error al subir imagen:', error);
        return res.status(500).json({
          message: "Error al subir la imagen",
          error: error.message
        });
      }
    }

    // Insertar el nuevo modelo
    const [result] = await pool.query(
      "INSERT INTO modelo (nombre, marca_id, tipo_maquina_id, peso_kg, img_url) VALUES (?, ?, ?, ?, ?)",
      [nombre, marca_id, tipo_maquina_id, peso_kg, img_url]
    );

    // Obtener el modelo recién creado
    const [newModelo] = await pool.query(
      `SELECT m.id, m.nombre, m.peso_kg, m.img_url, 
              ma.id as marca_id, ma.nombre AS marca,
              t.id as tipo_maquina_id, t.nombre AS tipo_maquina, 
              t.descripcion AS tipo_maquina_descripcion
       FROM modelo m
       JOIN marca ma ON m.marca_id = ma.id
       JOIN tipo_maquina t ON m.tipo_maquina_id = t.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newModelo[0]);
  } catch (error) {
    console.error('Error en createModelo:', error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Eliminar modelo
export const deleteModelo = async (req, res) => {
  const { id } = req.params;

  try {
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const [result] = await pool.query(
      "UPDATE modelo SET isDeleted = 1 WHERE id = ?",
      [idNumber]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Modelo no encontrado",
      });
    }

    res.status(204).end();
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Actualizar modelo
export const updateModelo = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('Body recibido:', req.body);
    console.log('Files recibidos:', req.files);
    console.log('ID a actualizar:', id);

    const idNumber = parseInt(id);
    if (isNaN(idNumber) || idNumber <= 0) {
      return res.status(400).json({
        message: "ID inválido"
      });
    }

    // Obtener los datos actuales del modelo
    const [currentModelo] = await pool.query(
      "SELECT * FROM modelo WHERE id = ? AND isDeleted = 0",
      [idNumber]
    );

    if (currentModelo.length === 0) {
      return res.status(404).json({
        message: "Modelo no encontrado"
      });
    }

    // Procesar y validar los datos recibidos
    const nombre = req.body.nombre ? req.body.nombre.trim() : currentModelo[0].nombre;
    const marca_id = req.body.marca_id ? parseInt(req.body.marca_id) : currentModelo[0].marca_id;
    const tipo_maquina_id = req.body.tipo_maquina_id ? parseInt(req.body.tipo_maquina_id) : currentModelo[0].tipo_maquina_id;
    const peso_kg = req.body.peso_kg ? parseFloat(req.body.peso_kg) : currentModelo[0].peso_kg;
    let img_url = currentModelo[0].img_url;

    // Validaciones
    if (nombre.trim() === '') {
      return res.status(400).json({
        message: "El nombre no puede estar vacío"
      });
    }

    if (req.body.marca_id) {
      if (isNaN(marca_id) || marca_id <= 0) {
        return res.status(400).json({
          message: "ID de marca inválido"
        });
      }
      // Verificar que la marca existe
/*       const [marcaExists] = await pool.query(
        "SELECT id FROM marca WHERE id = ? AND isDeleted = 0",
        [marca_id]
      );
      if (marcaExists.length === 0) {
        return res.status(400).json({
          message: "La marca especificada no existe"
        });
      } */
    }

    if (req.body.tipo_maquina_id) {
      if (isNaN(tipo_maquina_id) || tipo_maquina_id <= 0) {
        return res.status(400).json({
          message: "ID de tipo de máquina inválido"
        });
      }
      // Verificar que el tipo de máquina existe
      const [tipoExists] = await pool.query(
        "SELECT id FROM tipo_maquina WHERE id = ? AND isDeleted = 0",
        [tipo_maquina_id]
      );
      if (tipoExists.length === 0) {
        return res.status(400).json({
          message: "El tipo de máquina especificado no existe"
        });
      }
    }

    if (req.body.peso_kg && isNaN(peso_kg)) {
      return res.status(400).json({
        message: "El peso debe ser un número válido"
      });
    }

    // Manejar la carga de imágenes si existen
    if (req.files && req.files.imagen) {
      try {
        const imgData = await uploadFileToS3(req.files.imagen[0], "maquina");
        if (imgData && imgData.Location) {
          img_url = imgData.Location;
        }
      } catch (error) {
        console.error('Error al subir imagen:', error);
        return res.status(500).json({
          message: "Error al subir la imagen",
          error: error.message
        });
      }
    }

    // Actualizar el modelo
    const [result] = await pool.query(
      "UPDATE modelo SET nombre = ?, marca_id = ?, tipo_maquina_id = ?, peso_kg = ?, img_url = ? WHERE id = ? AND isDeleted = 0",
      [nombre, marca_id, tipo_maquina_id, peso_kg, img_url, idNumber]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "No se pudo actualizar el modelo"
      });
    }

    // Obtener el modelo actualizado
    const [updatedModelo] = await pool.query(
      `SELECT m.id, m.nombre, m.peso_kg, m.img_url, 
              ma.id as marca_id, ma.nombre AS marca,
              t.id as tipo_maquina_id, t.nombre AS tipo_maquina, 
              t.descripcion AS tipo_maquina_descripcion
       FROM modelo m
       JOIN marca ma ON m.marca_id = ma.id
       JOIN tipo_maquina t ON m.tipo_maquina_id = t.id
       WHERE m.id = ?`,
      [idNumber]
    );

    console.log('Modelo actualizado:', updatedModelo[0]);
    res.json(updatedModelo[0]);
  } catch (error) {
    console.error('Error en updateModelo:', error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};
