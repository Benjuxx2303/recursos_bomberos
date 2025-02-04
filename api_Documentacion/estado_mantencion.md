# Estado de Mantención

## Endpoints

### 1. Obtener Estados de Mantención con Paginación
- **Endpoint:** `GET /estado_mantencion`
- **Método:** GET
- **Descripción:** Obtiene todos los estados de mantención con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1)
  - `pageSize`: Tamaño de la página (opcional, por defecto 10)

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Estado A",
        "descripcion": "Descripción del estado A",
        "isDeleted": 0
    },
]
```

### 2. Obtener Estado de Mantención por ID
- **Endpoint:** `GET /estado_mantencion/:id`
- **Método:** GET
- **Descripción:** Obtiene un estado de mantención específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Estado A",
    "descripcion": "Descripción del estado A",
    "isDeleted": 0
}
```

### 3. Crear Estado de Mantención
- **Endpoint:** `POST /estado_mantencion`
- **Método:** POST
- **Descripción:** Crea un nuevo estado de mantención.
- **JSON Body:**
```json
{
    "nombre": "Estado B",
    "descripcion": "Descripción del estado B"
}
```

#### Respuesta
```json
{
    "id": 2,
    "nombre": "Estado B",
    "descripcion": "Descripción del estado B"
}
```

### 4. Eliminar Estado de Mantención
- **Endpoint:** `DELETE /estado_mantencion/:id`
- **Método:** DELETE
- **Descripción:** Marca un estado de mantención como eliminado.

#### Respuesta
```json
{
    "message": "Estado de mantención eliminado correctamente."
}
```

### 5. Actualizar Estado de Mantención
- **Endpoint:** `PATCH /estado_mantencion/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un estado de mantención existente.
- **JSON Body:**
```json
{
    "nombre": "Estado Actualizado",
    "descripcion": "Descripción actualizada",
    "isDeleted": 0
}
```

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Estado Actualizado",
    "descripcion": "Descripción actualizada",
    "isDeleted": 0
}
```