# Clave

## Endpoints

### 1. Obtener Claves con Paginación
- **Endpoint:** `GET /api/clave`
- **Método:** GET
- **Descripción:** Obtiene todas las claves con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1)
  - `pageSize`: Tamaño de la página (opcional, por defecto 10)

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Clave A",
        "descripcion": "Descripción de la clave A",
        "tipo_clave_id": 1
    },
]
```

### 2. Obtener Clave por ID
- **Endpoint:** `GET /api/clave/:id`
- **Método:** GET
- **Descripción:** Obtiene una clave específica por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Clave A",
    "descripcion": "Descripción de la clave A",
    "tipo_clave_id": 1
}
```

### 3. Crear Nueva Clave
- **Endpoint:** `POST /api/clave`
- **Método:** POST
- **Descripción:** Crea una nueva clave.
- **JSON Body:**
```json
{
    "nombre": "Clave B",
    "descripcion": "Descripción de la clave B",
    "tipo_clave_id": 1
}
```

#### Respuesta
```json
{
    "id": 2,
    "nombre": "Clave B",
    "descripcion": "Descripción de la clave B",
    "tipo_clave_id": 1
}
```

### 4. Dar de Baja una Clave
- **Endpoint:** `DELETE /api/clave/:id`
- **Método:** DELETE
- **Descripción:** Marca una clave como eliminada.

#### Respuesta
```json
{
    "message": "Clave eliminada correctamente."
}
```

### 5. Actualizar una Clave
- **Endpoint:** `PATCH /api/clave/:id`
- **Método:** PATCH
- **Descripción:** Actualiza una clave existente.
- **JSON Body:**
```json
{
    "nombre": "Clave Actualizada",
    "descripcion": "Descripción actualizada",
    "tipo_clave_id": 2,
    "isDeleted": 0
}
```

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Clave Actualizada",
    "descripcion": "Descripción actualizada",
    "tipo_clave_id": 2
}
```