# Tipo Mantención

## Endpoints

### 1. Obtener Todos los Tipos de Mantención con Paginación
- **Endpoint:** `GET /api/tipo_mantencion`
- **Método:** GET
- **Descripción:** Devuelve todos los tipos de mantención activos con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Mantenimiento Preventivo"
    },
]
```

### 2. Obtener Tipo de Mantención por ID
- **Endpoint:** `GET /api/tipo_mantencion/:id`
- **Método:** GET
- **Descripción:** Devuelve un tipo de mantención específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Mantenimiento Preventivo"
}
```

### 3. Crear un Nuevo Tipo de Mantención
- **Endpoint:** `POST /api/tipo_mantencion`
- **Método:** POST
- **Descripción:** Crea un nuevo tipo de mantención.
- **JSON Body:**
```json
{
    "nombre": "Nuevo Tipo"
}
```

#### Respuesta
```json
{
    "id": 2,
    "nombre": "Nuevo Tipo"
}
```

### 4. Actualizar un Tipo de Mantención
- **Endpoint:** `PATCH /api/tipo_mantencion/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un tipo de mantención existente.
- **JSON Body:**
```json
{
    "nombre": "Tipo Actualizado",
    "isDeleted": 0
}
```

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Tipo Actualizado"
}
```

### 5. Eliminar un Tipo de Mantención
- **Endpoint:** `DELETE /api/tipo_mantencion/:id`
- **Método:** DELETE
- **Descripción:** Marca un tipo de mantención como eliminado.

#### Respuesta
```json
{
    "message": "Tipo de mantención eliminado correctamente."
}
```