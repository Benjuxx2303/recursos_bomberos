# Tipo clave

## Endpoints

### 1. Obtener Todos los Tipos de Clave con Paginación
- **Endpoint:** `GET /api/tipo_clave`
- **Método:** GET
- **Descripción:** Devuelve todos los tipos de clave activos con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Tipo A"
    },
]
```

### 2. Obtener Tipo de Clave por ID
- **Endpoint:** `GET /api/tipo_clave/:id`
- **Método:** GET
- **Descripción:** Devuelve un tipo de clave específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Tipo A"
}
```

### 3. Crear un Nuevo Tipo de Clave
- **Endpoint:** `POST /api/tipo_clave`
- **Método:** POST
- **Descripción:** Crea un nuevo tipo de clave.
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

### 4. Actualizar un Tipo de Clave
- **Endpoint:** `PATCH /api/tipo_clave/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un tipo de clave existente.
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

### 5. Eliminar un Tipo de Clave
- **Endpoint:** `DELETE /api/tipo_clave/:id`
- **Método:** DELETE
- **Descripción:** Marca un tipo de clave como eliminado.

#### Respuesta
```json
{
    "message": "Tipo de clave eliminado correctamente."
}
```