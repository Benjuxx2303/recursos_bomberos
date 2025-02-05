# Procedencia

## Endpoints

### 1. Obtener Todas las Procedencias con Paginación
- **Endpoint:** `GET /api/procedencia`
- **Método:** GET
- **Descripción:** Devuelve todas las procedencias con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Procedencia A"
    },
]
```

### 2. Obtener Procedencia por ID
- **Endpoint:** `GET /api/procedencia/:id`
- **Método:** GET
- **Descripción:** Devuelve una procedencia específica por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Procedencia A"
}
```

### 3. Crear una Nueva Procedencia
- **Endpoint:** `POST /api/procedencia`
- **Método:** POST
- **Descripción:** Crea una nueva procedencia.
- **JSON Body:**
```json
{
    "nombre": "Procedencia B"
}
```

#### Respuesta
```json
{
    "id": 2,
    "nombre": "Procedencia B"
}
```

### 4. Actualizar una Procedencia
- **Endpoint:** `PATCH /api/procedencia/:id`
- **Método:** PATCH
- **Descripción:** Actualiza una procedencia existente.
- **JSON Body:**
```json
{
    "nombre": "Procedencia Actualizada"
}
```

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Procedencia Actualizada"
}
```

### 5. Eliminar una Procedencia
- **Endpoint:** `DELETE /api/procedencia/:id`
- **Método:** DELETE
- **Descripción:** Marca una procedencia como eliminada.

#### Respuesta
```json
{
    "message": "Procedencia eliminada correctamente."
}
```