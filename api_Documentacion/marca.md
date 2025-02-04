# Marca

## Endpoints

### 1. Obtener Todas las Marcas con Paginación
- **Endpoint:** `GET /api/marca`
- **Método:** GET
- **Descripción:** Obtiene todas las marcas con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Marca A"
    },
]
```

### 2. Obtener Marca por ID
- **Endpoint:** `GET /api/marca/:id`
- **Método:** GET
- **Descripción:** Obtiene una marca específica por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Marca A"
}
```

### 3. Crear una Nueva Marca
- **Endpoint:** `POST /api/marca`
- **Método:** POST
- **Descripción:** Crea una nueva marca.
- **JSON Body:**
```json
{
    "nombre": "Marca B"
}
```

#### Respuesta
```json
{
    "id": 2,
    "nombre": "Marca B"
}
```

### 4. Actualizar una Marca
- **Endpoint:** `PATCH /api/marca/:id`
- **Método:** PATCH
- **Descripción:** Actualiza una marca existente.
- **JSON Body:**
```json
{
    "nombre": "Marca Actualizada"
}
```

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Marca Actualizada"
}
```

### 5. Eliminar una Marca
- **Endpoint:** `DELETE /api/marca/:id`
- **Método:** DELETE
- **Descripción:** Marca una marca como eliminada.

#### Respuesta
```json
{
    "message": "Marca eliminada correctamente."
}
```