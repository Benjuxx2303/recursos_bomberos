

### POST `/api/bitacora`

Crea una nueva bitácora.

**Cuerpo de la solicitud (JSON):**

```json
{
    "compania_id": 1,
    "personal_id": 2,  
    "maquina_id": 3,
    "direccion": "Calle Falsa 123",
    "f_salida": "23-05-2023",
    "h_salida": "14:30",
    "f_llegada": "23-05-2023",
    "h_llegada": "18:00",
    "clave_id": 4,
    "km_salida": 100,
    "km_llegada": 150,
    "hmetro_salida": 10,
    "hmetro_llegada": 15,
    "hbomba_salida": 5,
    "hbomba_llegada": 8,
    "obs": "Observaciones opcionales"
}
```

**Descripción de los campos:**

- `compania_id` (número): ID de la compañía.
- `personal_id` (número): ID del personal.
- `maquina_id` (número): ID de la máquina.
- `direccion` (cadena): Dirección de la bitácora.
- `f_salida` (cadena): Fecha de salida en formato `dd-mm-aaaa`.
- `h_salida` (cadena): Hora de salida en formato `HH:mm`.
- `f_llegada` (cadena): Fecha de llegada en formato `dd-mm-aaaa`.
- `h_llegada` (cadena): Hora de llegada en formato `HH:mm`.
- `clave_id` (número): ID de la clave.
- `km_salida` (número): Kilometraje de salida.
- `km_llegada` (número): Kilometraje de llegada.
- `hmetro_salida` (número): Horómetro de salida.
- `hmetro_llegada` (número): Horómetro de llegada.
- `hbomba_salida` (número): Horómetro de bomba de salida.
- `hbomba_llegada` (número): Horómetro de bomba de llegada.
- `obs` (cadena, opcional): Observaciones.

**Respuesta exitosa (201 Created):**

```json
{
    "id": 1,
    "compania_id": 1,
    "personal_id": 2,
    "maquina_id": 3,
    "direccion": "Calle Falsa 123",
    "fh_salida": "23-05-2023 14:30",
    "fh_llegada": "23-05-2023 18:00",
    "clave_id": 4,
    "km_salida": 100,
    "km_llegada": 150,
    "hmetro_salida": 10,
    "hmetro_llegada": 15,
    "hbomba_salida": 5,
    "hbomba_llegada

":

 8,
    "obs": "Observaciones opcionales"
}
```

**Errores posibles:**

- `400 Bad Request`: Tipo de datos inválido o formato de fecha/hora incorrecto.
- `400 Bad Request`: Compañía, personal, máquina o clave no existen o están eliminados.
- `500 Internal Server Error`: Error en la creación de la bitácora.

### Código actualizado en 

bitacora.controllers.js



```javascript
// Crear una nueva bitácora
export const createBitacora = async (req, res) => {
    const {
        compania_id,
        personal_id, // Actualizado para referenciar a la tabla personal
        maquina_id,
        direccion,
        f_salida,
        h_salida,
        f_llegada,
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
        // Concatenar fecha y hora solo si ambas están presentes
        let fh_salida = null;
        let fh_llegada = null;
        if (f_salida && h_salida) {
            fh_salida = `${f_salida} ${h_salida}`;
        }
        if (f_llegada && h_llegada) {
            fh_llegada = `${f_llegada} ${h_llegada}`;
        }

        const query = `
            INSERT INTO bitacora (
                compania_id, personal_id, maquina_id, direccion, fh_salida, fh_llegada, clave_id, km_salida, km_llegada, hmetro_salida, hmetro_llegada, hbomba_salida, hbomba_llegada, obs, isDeleted
            ) VALUES (?, ?, ?, ?, STR_TO_DATE(?, "%d-%m-%Y %H:%i"), STR_TO_DATE(?, "%d-%m-%Y %H:%i"), ?, ?, ?, ?, ?, ?, ?, ?, 0)`;

        const [result] = await pool.query(query, [
            compania_id,
            personal_id, // Asegúrate de que este valor corresponde a un id válido en la tabla personal
            maquina_id,
            direccion,
            fh_salida,
            fh_llegada,
            clave_id,
            km_salida,
            km_llegada,
            hmetro_salida,
            hmetro_llegada,
            hbomba_salida,
            hbomba_llegada,
            obs
        ]);

        res.status(201).json({
            id: result.insertId,
            compania_id,
            personal_id,
            maquina_id,
            direccion,
            fh_salida,
            fh_llegada,
            clave_id,
            km_salida,
            km_llegada,
            hmetro_salida,
            hmetro_llegada,
            hbomba_salida,
            hbomba_llegada,
            obs
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
```

