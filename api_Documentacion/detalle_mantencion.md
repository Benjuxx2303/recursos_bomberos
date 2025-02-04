# Detalle de Mantención

## Endpoints

### 1. Obtener Detalles de Mantención con Paginación
- **Endpoint:** `GET /detalle_mantencion`
- **Método:** GET
- **Descripción:** Obtiene todos los detalles de mantención con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1)
  - `pageSize`: Tamaño de la página (opcional, por defecto 10)

#### Respuesta
```json
[
    {
        "id": 1,
        "mantencion_id": 1,
        "observacion": "Observación A",
        "servicio_id": 1,
        "isDeleted": 0
    },
]
```

### 2. Obtener Detalle de Mantención por ID
- **Endpoint:** `GET /detalle_mantencion/:id`
- **Método:** GET
- **Descripción:** Obtiene un detalle de mantención específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "mantencion_id": 1,
    "observacion": "Observación A",
    "servicio_id": 1,
    "isDeleted": 0
}
```

### 3. Obtener Detalles de Mantención por ID de Mantención
- **Endpoint:** `GET /detalle_mantencion/mantencion/:mantencion_id`
- **Método:** GET
- **Descripción:** Obtiene todos los detalles de mantención asociados a una mantención específica por ID.

#### Respuesta
```json
[
    {
        "id": 1,
        "mantencion_id": 1,
        "observacion": "Observación A",
        "servicio_id": 1,
        "isDeleted": 0
    },
    ...
]
```

### 4. Crear un Nuevo Detalle de Mantención
- **Endpoint:** `POST /detalle_mantencion`
- **Método:** POST
- **Descripción:** Crea un nuevo detalle de mantención.
- **JSON Body:**
```json
{
    "mantencion_id": 1,
    "observacion": "Observación nueva",
    "servicio_id": 1
}
```

#### Respuesta
```json
{
    "id": 1,
    "mantencion_id": 1,
    "observacion": "Observación nueva",
    "servicio_id": 1
}
```

### 5. Eliminar Detalle de Mantención
- **Endpoint:** `DELETE /detalle_mantencion/:id`
- **Método:** DELETE
- **Descripción:** Marca un detalle de mantención como eliminado.

#### Respuesta
```json
{
    "message": "Detalle de mantención eliminado correctamente."
}
```

### 6. Actualizar Detalle de Mantención
- **Endpoint:** `PATCH /detalle_mantencion/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un detalle de mantención existente.
- **JSON Body:**
```json
{
    "mantencion_id": 1,
    "observacion": "Observación actualizada",
    "servicio_id": 2,
    "isDeleted": 0
}
```

#### Respuesta
```json
{
    "id": 1,
    "mantencion_id": 1,
    "observacion": "Observación actualizada",
    "servicio_id": 2,
    "isDeleted": 0
}
```