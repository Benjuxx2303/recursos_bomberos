# Servicio

## Endpoints

### 1. Obtener Todos los Servicios con Paginación
- **Endpoint:** `GET /api/servicio`
- **Método:** GET
- **Descripción:** Devuelve todos los servicios con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).

#### Respuesta
```json
[
    {
        "id": 1,
        "subdivision_id": 1,
        "descripcion": "Servicio A",
        "subdivision": "Subdivisión A"
    },
]
```

### 2. Obtener Servicio por ID
- **Endpoint:** `GET /api/servicio/:id`
- **Método:** GET
- **Descripción:** Devuelve un servicio específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "subdivision_id": 1,
    "descripcion": "Servicio A",
    "subdivision": "Subdivisión A"
}
```

### 3. Crear un Nuevo Servicio
- **Endpoint:** `POST /api/servicio`
- **Método:** POST
- **Descripción:** Crea un nuevo servicio.
- **JSON Body:**
```json
{
    "subdivision_id": 1,
    "descripcion": "Nuevo Servicio"
}
```

#### Respuesta
```json
{
    "id": 2,
    "subdivision_id": 1,
    "descripcion": "Nuevo Servicio"
}
```

### 4. Actualizar un Servicio
- **Endpoint:** `PATCH /api/servicio/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un servicio existente.
- **JSON Body:**
```json
{
    "subdivision_id": 2,
    "descripcion": "Servicio Actualizado"
}
```

#### Respuesta
```json
{
    "id": 1,
    "subdivision_id": 2,
    "descripcion": "Servicio Actualizado"
}
```

### 5. Eliminar un Servicio
- **Endpoint:** `DELETE /api/servicio/:id`
- **Método:** DELETE
- **Descripción:** Marca un servicio como eliminado.

#### Respuesta
```json
{
    "message": "Servicio eliminado correctamente."
}
```