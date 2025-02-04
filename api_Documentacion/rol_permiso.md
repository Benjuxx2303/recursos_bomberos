# Rol-Permiso

## Endpoints

### 1. Obtener Todos los Rol-Permisos
- **Endpoint:** `GET /rol_permiso`
- **Método:** GET
- **Descripción:** Devuelve todos los permisos por rol.

#### Respuesta
```json
[
    {
        "id": 1,
        "rol_personal_id": 1,
        "permiso_id": 1,
        "permiso_nombre": "Permiso A",
        "rol_nombre": "Rol A"
    },
]
```

### 2. Obtener Rol-Permiso por ID
- **Endpoint:** `GET /rol_permiso/:id`
- **Método:** GET
- **Descripción:** Devuelve un rol-permiso específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "rol_personal_id": 1,
    "permiso_id": 1,
    "permiso_nombre": "Permiso A",
    "rol_nombre": "Rol A"
}
```

### 3. Crear un Nuevo Rol-Permiso
- **Endpoint:** `POST /rol_permiso`
- **Método:** POST
- **Descripción:** Crea un nuevo rol-permiso.
- **JSON Body:**
```json
{
    "rol_personal_id": 1,
    "permiso_id": 1
}
```

#### Respuesta
```json
{
    "id": 2,
    "rol_personal_id": 1,
    "permiso_id": 1
}
```

### 4. Eliminar un Rol-Permiso
- **Endpoint:** `DELETE /rol_permiso/:id`
- **Método:** DELETE
- **Descripción:** Marca un rol-permiso como eliminado.

#### Respuesta
```json
{
    "message": "Rol-Permiso eliminado correctamente."
}
```

### 5. Actualizar un Rol-Permiso
- **Endpoint:** `PATCH /rol_permiso/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un rol-permiso existente.
- **JSON Body:**
```json
{
    "rol_personal_id": 1,
    "permiso_id": 2,
    "isDeleted": 0
}
```

#### Respuesta
```json
{
    "id": 1,
    "rol_personal_id": 1,
    "permiso_id": 2
}
```