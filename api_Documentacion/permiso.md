# Permiso

## Endpoints

### 1. Obtener Todos los Permisos
- **Endpoint:** `GET /api/permiso`
- **Método:** GET
- **Descripción:** Devuelve todos los permisos.

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Permiso A",
        "descripcion": "Descripción del permiso A"
    },
]
```

### 2. Obtener Permiso por ID
- **Endpoint:** `GET /api/permiso/:id`
- **Método:** GET
- **Descripción:** Devuelve un permiso específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Permiso A",
    "descripcion": "Descripción del permiso A"
}
```

### 3. Crear un Nuevo Permiso
- **Endpoint:** `POST /api/permiso`
- **Método:** POST
- **Descripción:** Crea un nuevo permiso.
- **JSON Body:**
```json
{
    "nombre": "Permiso B",
    "descripcion": "Descripción del permiso B"
}
```

#### Respuesta
```json
{
    "id": 2,
    "nombre": "Permiso B",
    "descripcion": "Descripción del permiso B"
}
```

### 4. Actualizar un Permiso
- **Endpoint:** `PATCH /api/permiso/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un permiso existente.
- **JSON Body:**
```json
{
    "nombre": "Permiso Actualizado",
    "descripcion": "Descripción actualizada del permiso"
}
```

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Permiso Actualizado",
    "descripcion": "Descripción actualizada del permiso"
}
```

### 5. Eliminar un Permiso
- **Endpoint:** `DELETE /api/permiso/:id`
- **Método:** DELETE
- **Descripción:** Marca un permiso como eliminado.

#### Respuesta
```json
{
    "message": "Permiso eliminado correctamente."
}
```