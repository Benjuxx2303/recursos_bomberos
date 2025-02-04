# Bitácora

## Endpoints

### 1. Obtener Bitácora con Filtros
- **Endpoint:** `GET /bitacora/search`
- **Método:** GET
- **Descripción:** Obtiene registros de bitácora con filtros opcionales.
- **Query Params:**
  - `id`: ID de la bitácora (opcional)
  - `compania`: Nombre de la compañía (opcional)
  - `rut_personal`: RUT del conductor (opcional)
  - `taller`: Nombre del taller (opcional)
  - `fecha_salida`: Fecha de salida en formato `dd-mm-yyyy` (opcional)
  - `isCargaCombustible`: Indica si hay carga de combustible (0 o 1, opcional)
  - `isMantencion`: Indica si hay mantención (0 o 1, opcional)

#### Respuesta
```json
[
    {
        "id": 1,
        "compania": "Compañía A",
        "rut_conductor": "12345678-9",
        "nombre_conductor": "Juan",
        "apellido_conductor": "Pérez",
        "patente_maquina": "ABCD123",
        "tipo_maquina": "Tipo A",
        "fh_salida": "01-01-2022 10:00",
        "fh_llegada": "01-01-2022 12:00",
        "clave": "Clave A",
        "direccion": "Dirección A",
        "km_salida": 10,
        "km_llegada": 20,
        "hmetro_salida": 5,
        "hmetro_llegada": 10,
        "hbomba_salida": 2,
        "hbomba_llegada": 4,
        "obs": "Observación A"
    },
]
```

### 2. Obtener Bitácora con Paginación
- **Endpoint:** `GET /bitacora`
- **Método:** GET
- **Descripción:** Obtiene registros de bitácora con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1)
  - `pageSize`: Tamaño de la página (opcional, por defecto 10)
  - `isCargaCombustible`: Indica si hay carga de combustible (0 o 1, opcional)
  - `isMantencion`: Indica si hay mantención (0 o 1, opcional)

#### Respuesta
```json
[
    {
        "id": 1,
        "compania": "Compañía A",
        "rut_conductor": "12345678-9",
        "patente_maquina": "ABCD123",
        "tipo_maquina": "Tipo A",
        "fh_salida": "01-01-2022 10:00",
        "fh_llegada": "01-01-2022 12:00",
        "clave": "Clave A",
        "direccion": "Dirección A",
        "km_salida": 10,
        "km_llegada": 20,
        "hmetro_salida": 5,
        "hmetro_llegada": 10,
        "hbomba_salida": 2,
        "hbomba_llegada": 4,
        "obs": "Observación A"
    },
]
```

### 3. Obtener Bitácora por ID
- **Endpoint:** `GET /bitacora/:id`
- **Método:** GET
- **Descripción:** Obtiene un registro de bitácora por su ID.

#### Respuesta
```json
{
    "id": 1,
    "compania": "Compañía A",
    "rut_conductor": "12345678-9",
    "patente_maquina": "ABCD123",
    "tipo_maquina": "Tipo A",
    "fh_salida": "01-01-2022 10:00",
    "fh_llegada": "01-01-2022 12:00",
    "clave": "Clave A",
    "direccion": "Dirección A",
    "km_salida": 10,
    "km_llegada": 20,
    "hmetro_salida": 5,
    "hmetro_llegada": 10,
    "hbomba_salida": 2,
    "hbomba_llegada": 4,
    "obs": "Observación A"
}
```

### 4. Crear una Nueva Bitácora
- **Endpoint:** `POST /bitacora`
- **Método:** POST
- **Descripción:** Crea un nuevo registro de bitácora.
- **JSON Body:**
```json
{
    "compania_id": 1,
    "personal_id": 1,
    "maquina_id": 1,
    "direccion": "Dirección A",
    "f_salida": "01-01-2022",
    "h_salida": "10:00",
    "clave_id": 1,
    "km_salida": 10,
    "km_llegada": 20,
    "hmetro_salida": 5,
    "hmetro_llegada": 10,
    "hbomba_salida": 2,
    "hbomba_llegada": 4,
    "obs": "Observación A"
}
```

#### Respuesta
```json
{
    "id": 1,
    "compania_id": 1,
    "personal_id": 1,
    "maquina_id": 1,
    "direccion": "Dirección A",
    "fh_salida": "01-01-2022 10:00",
    "clave_id": 1,
    "km_salida": 10,
    "km_llegada": 20,
    "hmetro_salida": 5,
    "hmetro_llegada": 10,
    "hbomba_salida": 2,
    "hbomba_llegada": 4,
    "obs": "Observación A"
}
```

### 5. Obtener Última Bitácora
- **Endpoint:** `GET /bitacora/last`
- **Método:** GET
- **Descripción:** Obtiene el último registro de bitácora.

#### Respuesta
```json
{
    "fh_llegada": "01-01-2022 12:00",
    "km_llegada": 20,
    "hmetro_llegada": 10,
    "hbomba_llegada": 4
}
```

### 6. Eliminar una Bitácora
- **Endpoint:** `DELETE /bitacora/:id`
- **Método:** DELETE
- **Descripción:** Marca una bitácora como eliminada.

#### Respuesta
```json
{
    "message": "Bitácora eliminada correctamente."
}
```

### 7. Actualizar una Bitácora
- **Endpoint:** `PATCH /bitacora/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un registro de bitácora.
- **JSON Body:**
```json
{
    "compania_id": 1,
    "personal_id": 1,
    "maquina_id": 1,
    "clave_id": 1,
    "direccion": "Dirección Actualizada",
    "f_salida": "01-01-2022",
    "h_salida": "10:00",
    "f_llegada": "01-01-2022",
    "h_llegada": "12:00",
    "km_salida": 10,
    "km_llegada": 20,
    "hmetro_salida": 5,
    "hmetro_llegada": 10,
    "hbomba_salida": 2,
    "hbomba_llegada": 4,
    "obs": "Observación Actualizada",
    "isDeleted": 0
}
```

#### Respuesta
```json
{
    "id": 1,
    "compania_id": 1,
    "personal_id": 1,
    "maquina_id": 1,
    "direccion": "Dirección Actualizada",
    "fh_salida": "01-01-2022 10:00",
    "fh_llegada": "01-01-2022 12:00",
    "clave_id": 1,
    "km_salida": 10,
    "km_llegada": 20,
    "hmetro_salida": 5,
    "hmetro_llegada": 10,
    "hbomba_salida": 2,
    "hbomba_llegada": 4,
    "obs": "Observación Actualizada"
}
```

### 8. Finalizar Servicio
- **Endpoint:** `PATCH /bitacora/:id/end`
- **Método:** PATCH
- **Descripción:** Finaliza un servicio en la bitácora.
- **JSON Body:**
```json
{
    "f_llegada": "01-01-2022",
    "h_llegada": "12:00",
    "km_llegada": 20,
    "hmetro_llegada": 10,
    "hbomba_llegada": 4,
    "obs": "Observación finalizada"
}
```

#### Respuesta
```json
{
    "message": "Bitácora finalizada correctamente."
}
```