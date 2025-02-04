# Carga de Combustible

## Endpoints

### 1. Obtener Cargas de Combustible con Paginación
- **Endpoint:** `GET /carga_combustible`
- **Método:** GET
- **Descripción:** Obtiene todas las cargas de combustible con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1)
  - `pageSize`: Tamaño de la página (opcional, por defecto 10)

#### Respuesta
```json
[
    {
        "id": 1,
        "bitacora": {
            "id": 1,
            "compania": "Compañía A",
            "conductor_rut": "12345678-9",
            "conductor_nombre": "Juan",
            "conductor_apellido": "Pérez",
            "direccion": "Dirección A",
            "h_salida": "01-01-2022 10:00",
            "h_llegada": "01-01-2022 12:00"
        },
        "litros": 50,
        "valor_mon": 50000,
        "img_url": "http://example.com/image.jpg"
    },
    ...
]
```

### 2. Obtener Carga de Combustible por ID
- **Endpoint:** `GET /carga_combustible/:id`
- **Método:** GET
- **Descripción:** Obtiene una carga de combustible específica por ID.

#### Respuesta
```json
{
    "id": 1,
    "bitacora": {
        "id": 1,
        "direccion": "Dirección A",
        "fh_salida": "01-01-2022 10:00",
        "fh_llegada": "01-01-2022 12:00",
        "km_salida": 10,
        "km_llegada": 20,
        "hmetro_salida": 5,
        "hmetro_llegada": 10,
        "hbomba_salida": 2,
        "hbomba_llegada": 4,
        "obs": "Observación A"
    },
    "litros": 50,
    "valor_mon": 50000,
    "img_url": "http://example.com/image.jpg"
}
```

### 3. Crear una Nueva Carga de Combustible
- **Endpoint:** `POST /carga_combustible/simple`
- **Método:** POST
- **Descripción:** Crea una nueva carga de combustible.
- **JSON Body:**
```json
{
    "bitacora_id": 1,
    "litros": 50,
    "valor_mon": 50000
}
```

#### Respuesta
```json
{
    "id": 1,
    "bitacora_id": 1,
    "litros": 50,
    "valor_mon": 50000,
    "img_url": "http://example.com/image.jpg",
    "message": "Carga de combustible creada exitosamente"
}
```

### 4. Crear una Carga de Combustible con Bitácora
- **Endpoint:** `POST /carga_combustible`
- **Método:** POST
- **Descripción:** Crea una nueva carga de combustible junto con una bitácora.
- **JSON Body:**
```json
{
    "bitacora.compania_id": 1,
    "bitacora.personal_id": 1,
    "bitacora.maquina_id": 1,
    "bitacora.direccion": "Dirección A",
    "bitacora.f_salida": "01-01-2022",
    "bitacora.h_salida": "10:00",
    "bitacora.f_llegada": "01-01-2022",
    "bitacora.h_llegada": "12:00",
    "bitacora.clave_id": 1,
    "bitacora.km_salida": 10,
    "bitacora.km_llegada": 20,
    "bitacora.hmetro_salida": 5,
    "bitacora.hmetro_llegada": 10,
    "bitacora.hbomba_salida": 2,
    "bitacora.hbomba_llegada": 4,
    "bitacora.obs": "Observación A",
    "litros": 50,
    "valor_mon": 50000
}
```

#### Respuesta
```json
{
    "id": 1,
    "bitacora_id": 1,
    "litros": 50,
    "valor_mon": 50000,
    "img_url": "http://example.com/image.jpg"
}
```

### 5. Dar de Baja una Carga de Combustible
- **Endpoint:** `DELETE /carga_combustible/:id`
- **Método:** DELETE
- **Descripción:** Marca una carga de combustible como eliminada.

#### Respuesta
```json
{
    "message": "Carga de combustible eliminada correctamente."
}
```

### 6. Actualizar una Carga de Combustible Existente
- **Endpoint:** `PATCH /carga_combustible/:id`
- **Método:** PATCH
- **Descripción:** Actualiza una carga de combustible existente.
- **JSON Body:**
```json
{
    "bitacora_id": 1,
    "litros": 55,
    "valor_mon": 55000
}
```

#### Respuesta
```json
{
    "id": 1,
    "bitacora_id": 1,
    "litros": 55,
    "valor_mon": 55000,
    "img_url": "http://example.com/image.jpg",
    "message": "Carga de combustible actualizada exitosamente"
}
```