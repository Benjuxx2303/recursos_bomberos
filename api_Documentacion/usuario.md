# Usuarios

## Endpoints

### 1. Obtener Todos los Usuarios con Detalles y Paginación
- **Endpoint:** `GET /api/usuario`
- **Método:** GET
- **Descripción:** Devuelve todos los usuarios activos con detalles y paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).

#### Respuesta
```json
[
    {
        "id": 1,
        "username": "jdoe",
        "correo": "jdoe@example.com",
        "Nombre": "Juan",
        "Apellido": "Doe"
    },
]
```

### 2. Obtener Usuario por ID
- **Endpoint:** `GET /api/usuario/:id`
- **Método:** GET
- **Descripción:** Devuelve un usuario específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "username": "jdoe",
    "correo": "jdoe@example.com"
}
```

### 3. Eliminar Usuario (Cambiar Estado)
- **Endpoint:** `DELETE /api/usuario/:id`
- **Método:** DELETE
- **Descripción:** Marca un usuario como eliminado.

#### Respuesta
```json
{
    "message": "Usuario eliminado correctamente."
}
```

### 4. Actualizar Usuario
- **Endpoint:** `PATCH /api/usuario/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un usuario existente.
- **JSON Body:**
```json
{
    "username": "john_doe",
    "correo": "john_doe@example.com",
    "contrasena": "newpassword",
    "personal_id": 2
}
```

#### Respuesta
```json
{
    "id": 1,
    "username": "john_doe",
    "correo": "john_doe@example.com"
}
```

### 5. Registrar Nuevo Usuario
- **Endpoint:** `POST /api/usuario/register`
- **Método:** POST
- **Descripción:** Registra un nuevo usuario.
- **JSON Body:**
```json
{
    "username": "jdoe",
    "correo": "jdoe@example.com",
    "contrasena": "password123",
    "personal_id": 1
}
```

#### Respuesta
```json
{
    "message": "Usuario registrado exitosamente. Se ha enviado un correo de verificación.",
    "userId": 1
}
```

### 6. Iniciar Sesión
- **Endpoint:** `POST /api/usuario/login`
- **Método:** POST
- **Descripción:** Inicia sesión de un usuario.
- **JSON Body:**
```json
{
    "username": "jdoe",
    "contrasena": "password123"
}
```

#### Respuesta
```json
{
    "message": "Inicio de sesión exitoso",
    "token": "your_jwt_token",
    "user": {
        "id": 1,
        "username": "jdoe",
        "correo": "jdoe@example.com",
        "nombre": "Juan Doe",
        "rol": "Admin",
        "compania": "Compañía XYZ",
        "img_url": "url_to_image",
        "permisos": []
    }
}
```

### 7. Recuperar Contraseña
- **Endpoint:** `POST /api/usuario/recover-password`
- **Método:** POST
- **Descripción:** Envía un correo con instrucciones para recuperar la contraseña.
- **JSON Body:**
```json
{
    "correo": "jdoe@example.com"
}
```

#### Respuesta
```json
{
    "message": "Se ha enviado un correo con las instrucciones para restablecer tu contraseña"
}
```

### 8. Verificar Token de Restablecimiento
- **Endpoint:** `POST /api/usuario/verify-reset-token`
- **Método:** POST
- **Descripción:** Verifica el token de restablecimiento de contraseña.
- **JSON Body:**
```json
{
    "token": "your_reset_token"
}
```

#### Respuesta
```json
{
    "message": "Token válido"
}
```

### 9. Resetear Contraseña
- **Endpoint:** `POST /api/usuario/reset-password`
- **Método:** POST
- **Descripción:** Restablece la contraseña de un usuario.
- **JSON Body:**
```json
{
    "token": "your_reset_token",
    "contrasena": "newpassword"
}
```

#### Respuesta
```json
{
    "message": "Contraseña actualizada correctamente"
}
```

### 10. Verificar Correo
- **Endpoint:** `GET /api/usuario/verify-email/:token`
- **Método:** GET
- **Descripción:** Verifica el correo de un usuario utilizando un token.
  
#### Respuesta
```json
{
    "message": "Correo verificado con éxito"
}
```