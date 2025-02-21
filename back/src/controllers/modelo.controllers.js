import { pool } from "../db.js";
import { uploadFileToS3 } from "../utils/fileUpload.js";

// TODO: Combinar "getModelos" y "getModelosPage" en una sola función

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
  let {
    nombre,
    marca_id,
    tipo_maquina_id,
    peso_kg,
  } = req.body;

  const errors = [];

  try {
    // // Validar campos requeridos
    // if (!req.body.nombre || !req.body.marca_id || !req.body.tipo_maquina_id) {
    //   return res.status(400).json({
    //     message: "Los campos nombre, marca_id y tipo_maquina_id son requeridos"
    //   });
    // }

    // validar datos requeridos
    if(!nombre || !marca_id || !tipo_maquina_id){
      errors.push(`Los campos: 'nombre', 'marca_id' y 'tipo_maquina_id' son requeridos`)
    }


    // const nombre = req.body.nombre.trim();
    // const marca_id = parseInt(req.body.marca_id);
    // const tipo_maquina_id = parseInt(req.body.tipo_maquina_id);
    // const peso_kg = req.body.peso_kg ? parseFloat(req.body.peso_kg) : null;
    // let img_url = null;

    // Validaciones adicionales
    if (nombre === '' && nombre.trim() === '') {
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

    let img_url = null;

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
  let { nombre, marca_id, tipo_maquina_id, peso_kg } = req.body;
  let errors = [];

  try {
      const idNumber = parseInt(id);
      if (isNaN(idNumber) || idNumber <= 0) {
          return res.status(400).json({ message: "ID inválido" });
      }

      // Obtener los datos actuales del modelo
      const [currentModelo] = await pool.query(
          "SELECT * FROM modelo WHERE id = ? AND isDeleted = 0",
          [idNumber]
      );

      if (currentModelo.length === 0) {
          return res.status(404).json({ message: "Modelo no encontrado" });
      }

      const updates = {};
      
if (nombre !== undefined) {
    nombre = String(nombre).trim();
    if (nombre.length === 0) {
        errors.push('El nombre no puede estar vacío');
    } else if (!isNaN(nombre)) {  // Agregar esta validación extra
        errors.push('Tipo de dato inválido para "nombre"');
    } else {
        updates.nombre = nombre;
    }
}

if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(", ") });  // Asegúrate de enviar el mensaje correctamente
}


      if (marca_id !== undefined) {
          marca_id = parseInt(marca_id);
          if (isNaN(marca_id) || marca_id <= 0) {
              errors.push("ID de marca inválido");
          }
          // Verificar que la marca existe (descomentado si es necesario)
          /* const [marcaExists] = await pool.query(
              "SELECT id FROM marca WHERE id = ? AND isDeleted = 0",
              [marca_id]
          );
          if (marcaExists.length === 0) {
              errors.push("La marca especificada no existe");
          } */
          if (!errors.length) {
              updates.marca_id = marca_id;
          }
      }

      if (tipo_maquina_id !== undefined) {
          tipo_maquina_id = parseInt(tipo_maquina_id);
          if (isNaN(tipo_maquina_id) || tipo_maquina_id <= 0) {
              errors.push("ID de tipo de máquina inválido");
          } else {
              const [tipoExists] = await pool.query(
                  "SELECT id FROM tipo_maquina WHERE id = ? AND isDeleted = 0",
                  [tipo_maquina_id]
              );
              if (tipoExists.length === 0) {
                  errors.push("El tipo de máquina especificado no existe");
              } else {
                  updates.tipo_maquina_id = tipo_maquina_id;
              }
          }
      }

      if (peso_kg !== undefined) {
          peso_kg = parseFloat(peso_kg);
          if (isNaN(peso_kg)) {
              errors.push("El peso debe ser un número válido");
          } else {
              updates.peso_kg = peso_kg;
          }
      }

      // Manejar la carga de imágenes si existen
      let img_url = currentModelo.length > 0 ? currentModelo[0].img_url : null;
      if (req.files && req.files.imagen) {
          try {
              const imgData = await uploadFileToS3(req.files.imagen[0], "maquina");
              if (imgData && imgData.Location) {
                  img_url = imgData.Location;
              }
          } catch (error) {
              return res.status(500).json({ message: "Error al subir la imagen", error: error.message });
          }
      }
      if (img_url) {
          updates.img_url = img_url;
      }

      if (errors.length > 0) {
          return res.status(400).json({ errors });
      }

      const setClause = Object.keys(updates)
          .map((key) => `${key} = ?`)
          .join(", ");
      
      if (!setClause) {
          return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
      }

      const values = Object.values(updates).concat(idNumber);
      const [result] = await pool.query(`UPDATE modelo SET ${setClause} WHERE id = ? AND isDeleted = 0`, values);

      if (result.affectedRows === 0) {
          return res.status(404).json({ message: "No se pudo actualizar el modelo" });
      }

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

      res.json(updatedModelo[0]);
  } catch (error) {
      return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};
