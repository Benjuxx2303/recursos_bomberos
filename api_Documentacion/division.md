# División

## Endpoints

### 1. Obtener Divisiones con Paginación
- **Endpoint:** `GET /api/division`
- **Método:** GET
- **Descripción:** Obtiene todas las divisiones con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1)
  - `pageSize`: Tamaño de la página (opcional, por defecto 10)

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "División A",
        "isDeleted": 0
    },
]
```

### 2. Obtener División por ID
- **Endpoint:** `GET /api/division/:id`
- **Método:** GET
- **Descripción:** Obtiene una división específica por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "División A",
    "isDeleted": 0
}
```

### 3. Crear una Nueva División
- **Endpoint:** `POST /api/division`
- **Método:** POST
- **Descripción:** Crea una nueva división.
- **JSON Body:**
```json
{
    "nombre": "División B"
}
```

#### Respuesta
```json
{
    "id": 2,
    "nombre": "División B"
}
```

### 4. Eliminar una División
- **Endpoint:** `DELETE /api/division/:id`
- **Método:** DELETE
- **Descripción:** Marca una división como eliminada.

#### Respuesta
```json
{
    "message": "División eliminada correctamente."
}
```

### 5. Actualizar una División
- **Endpoint:** `PATCH /api/division/:id`
- **Método:** PATCH
- **Descripción:** Actualiza una división existente.
- **JSON Body:**
```json
{
    "nombre": "División Actualizada",
    "isDeleted": 0
}
```

#### Respuesta
```json
{
    "id": 1,
    "nombre": "División Actualizada",
    "isDeleted": 0
}
```