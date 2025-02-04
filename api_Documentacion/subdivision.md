# Subdivisiones

## Endpoints

### 1. Obtener Todas las Subdivisiones con Paginación
- **Endpoint:** `GET /subdivision`
- **Método:** GET
- **Descripción:** Devuelve todas las subdivisiones activas con detalles de la división.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Subdivisión A",
        "division_id": 1,
        "division": "División A"
    },
]
```

### 2. Obtener Subdivisión por ID
- **Endpoint:** `GET /subdivision/:id`
- **Método:** GET
- **Descripción:** Devuelve una subdivisión específica por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Subdivisión A",
    "division_id": 1,
    "division": "División A"
}
```

### 3. Crear una Nueva Subdivisión
- **Endpoint:** `POST /subdivision`
- **Método:** POST
- **Descripción:** Crea una nueva subdivisión.
- **JSON Body:**
```json
{
    "division_id": 1,
    "nombre": "Subdivisión B"
}
```

#### Respuesta
```json
{
    "id": 2,
    "division_id": 1,
    "nombre": "Subdivisión B"
}
```

### 4. Actualizar una Subdivisión
- **Endpoint:** `PATCH /subdivision/:id`
- **Método:** PATCH
- **Descripción:** Actualiza una subdivisión existente.
- **JSON Body:**
```json
{
    "division_id": 1,
    "nombre": "Subdivisión Actualizada",
    "isDeleted": 0
}
```

#### Respuesta
```json
{
    "id": 1,
    "division_id": 1,
    "nombre": "Subdivisión Actualizada"
}
```

### 5. Eliminar una Subdivisión
- **Endpoint:** `DELETE /subdivision/:id`
- **Método:** DELETE
- **Descripción:** Marca una subdivisión como eliminada.

#### Respuesta
```json
{
    "message": "Subdivisión eliminada correctamente."
}
```