# Rol Personal

## Endpoints

### 1. Obtener Todos los Roles de Personal con Paginación
- **Endpoint:** `GET /rol_personal`
- **Método:** GET
- **Descripción:** Devuelve todos los roles de personal con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Rol A",
        "descripcion": "Descripción del rol A"
    },
]
```

### 2. Obtener Rol de Personal por ID
- **Endpoint:** `GET /rol_personal/:id`
- **Método:** GET
- **Descripción:** Devuelve un rol de personal específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Rol A",
    "descripcion": "Descripción del rol A"
}
```

### 3. Crear un Nuevo Rol de Personal
- **Endpoint:** `POST /rol_personal`
- **Método:** POST
- **Descripción:** Crea un nuevo rol de personal.
- **JSON Body:**
```json
{
    "nombre": "Rol B",
    "descripcion": "Descripción del rol B"
}
```

#### Respuesta
```json
{
    "id": 2,
    "nombre": "Rol B",
    "descripcion": "Descripción del rol B"
}
```

### 4. Actualizar un Rol de Personal
- **Endpoint:** `PATCH /rol_personal/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un rol de personal existente.
- **JSON Body:**
```json
{
    "nombre": "Rol Actualizado",
    "descripcion": "Descripción actualizada del rol"
}
```

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Rol Actualizado",
    "descripcion": "Descripción actualizada del rol"
}
```

### 5. Eliminar un Rol de Personal
- **Endpoint:** `DELETE /rol_personal/:id`
- **Método:** DELETE
- **Descripción:** Marca un rol de personal como eliminado.

#### Respuesta
```json
{
    "message": "Rol-Permiso eliminado correctamente."
}
```