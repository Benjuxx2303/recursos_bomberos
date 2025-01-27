### POST `/api/personal`

Crea un nuevo registro de personal.

**Cuerpo de la solicitud (JSON):**

```json
{
    "rut": "12.345.678-9",
    "nombre": "Juan",
    "apellido": "Pérez",
    "fec_nac": "01-01-1990",
    "fec_ingreso": "15-03-2015",
    "rol_personal_id": 2,
    "compania_id": 1,
    "obs": "Observaciones opcionales"
}
```

**Descripción de los campos:**

- `rut` (cadena): RUT del personal.
- `nombre` (cadena): Nombre del personal.
- `apellido` (cadena): Apellido del personal.
- `fec_nac` (cadena): Fecha de nacimiento en formato `dd-mm-aaaa`.
- `fec_ingreso` (cadena): Fecha de ingreso en formato `dd-mm-aaaa`.
- `rol_personal_id` (número): ID del rol del personal.
- `compania_id` (número): ID de la compañía.
- `obs` (cadena, opcional): Observaciones.

**Respuesta exitosa (201 Created):**

```json
{
    "id": 1,
    "rut": "12.345.678-9",
    "nombre": "Juan",
    "apellido": "Pérez",
    "fec_nac": "01-01-1990",
    "fec_ingreso": "15-03-2015",
    "rol_personal_id": 2,
    "compania_id": 1,
    "obs": "Observaciones opcionales",
    "isDeleted": 0
}
```

**Errores posibles:**

- `400 Bad Request`: Tipo de datos inválido o formato de fecha incorrecto.
- `500 Internal Server Error`: Error en la creación del registro de personal.

### PATCH `/api/personal/:id/image`

Actualiza la imagen de un registro de personal.

**Parámetros de ruta:**

- `id` (número): ID del personal.

**Cuerpo de la solicitud (form-data):**

- `file` (archivo): Archivo de imagen a subir.

**Respuesta exitosa (200 OK):**

```json
{
    "message": "Imagen actualizada correctamente",
    "imageUrl": "https://ruta/a/la/imagen.jpg"
}
```

**Errores posibles:**

- `400 Bad Request`: No se proporcionó un archivo o el archivo no es una imagen válida.
- `404 Not Found`: No se encontró el registro de personal con el ID proporcionado.
- `500 Internal Server Error`: Error en la actualización de la imagen.

### Rutas en 

personal.routes.js

Estas rutas están protegidas por el middleware 
checkRole
, que asegura que solo los usuarios con el rol `TELECOM` pueden acceder a ellas.