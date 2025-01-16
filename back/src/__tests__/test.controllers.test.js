export const updateCompania = async (req, res) => {
    const { id } = req.params;
    let { nombre, direccion, isDeleted } = req.body;
    const errors = []; // Arreglo para capturar errores

    try {
        const idNumber = parseInt(id);
        if (isNaN(idNumber)) {
            return res.status(400).json({ errors: ["ID inválido"] });
        }
        
        
                if (req.files) {
            const imagen = req.files.imagen ? req.files.imagen[0] : null;

            if (imagen) {
                try {
                    const imgData = await uploadFileToS3(imagen, "compania");
                    if (imgData && imgData.Location) {
                        updates.img_url = imgData.Location;
                    } else {
                        errors.push("No se pudo obtener la URL de la imagen");
                    }
                } catch (error) {
                    errors.push("Error al subir la imagen", error.message);
                }
            }
        }

        // Validaciones
        if (nombre !== undefined) {
            nombre = String(nombre).trim();
            if (typeof nombre !== "string" || nombre.length === 0) {
                errors.push("Tipo de datos inválido para 'nombre'");
            }
            if (nombre.length > 50) {
                errors.push("El nombre de la compañía es demasiado largo");
            }
        }

        if (direccion !== undefined) {
            direccion = String(direccion).trim();
            if (typeof direccion !== "string" || direccion.length === 0) {
                errors.push("Tipo de datos inválido para 'direccion'");
            }
            if (direccion.length > 100) {
                errors.push("La dirección de la compañía es demasiado larga");
            }
        }

        if (isDeleted !== undefined) {
            if (typeof isDeleted !== "number" || (isDeleted !== 0 && isDeleted !== 1)) {
                errors.push("Tipo de dato inválido para 'isDeleted'");
            }
        }

        // Si se encontraron errores, devolverlos
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Construir la consulta de actualización
        const updates = {};
        if (nombre !== undefined) updates.nombre = nombre;
        if (direccion !== undefined) updates.direccion = direccion;
        if (isDeleted !== undefined) updates.isDeleted = isDeleted;

        const setClause = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ");

        if (!setClause) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        }

        const values = Object.values(updates).concat(idNumber);
        const [result] = await pool.query(`UPDATE compania SET ${setClause} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Compañía no encontrada' });
        }

        const [rows] = await pool.query('SELECT * FROM compania WHERE id = ?', [idNumber]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            errors: [error.message]
        });
    }
};