# Talleres

## Endpoints

### 1. Obtener Todos los Talleres con Paginación
- **Endpoint:** `GET /api/taller`
- **Método:** GET
- **Descripción:** Devuelve todos los talleres activos con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).

#### Respuesta
```json
[
    {
        "id": 1,
        "tipo": "Mecánico",
        "razon_social": "Taller A",
        "rut": "12345678-9",
        "telefono": "123456789",
        "contacto": "Juan Pérez",
        "tel_contacto": "987654321",
        "direccion": "Av. Siempre Viva 742",
        "correo": "contacto@tallera.cl"
    },
]
```

### 2. Obtener Taller por ID
- **Endpoint:** `GET /api/taller/:id`
- **Método:** GET
- **Descripción:** Devuelve un taller específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "tipo": "Mecánico",
    "razon_social": "Taller A",
    "rut": "12345678-9",
    "telefono": "123456789",
    "contacto": "Juan Pérez",
    "tel_contacto": "987654321",
    "direccion": "Av. Siempre Viva 742",
    "correo": "contacto@tallera.cl"
}
```

### 3. Crear un Nuevo Taller
- **Endpoint:** `POST /api/taller`
- **Método:** POST
- **Descripción:** Crea un nuevo taller.
- **JSON Body:**
```json
{
    "tipo": "Mecánico",
    "razon_social": "Taller B",
    "rut": "98765432-1",
    "telefono": "987654321",
    "contacto": "María López",
    "tel_contacto": "123123123",
    "direccion": "Calle Falsa 123",
    "correo": "info@tallerb.cl"
}
```

#### Respuesta
```json
{
    "id": 2,
    "tipo": "Mecánico",
    "razon_social": "Taller B",
    "rut": "98765432-1",
    "telefono": "987654321",
    "contacto": "María López",
    "tel_contacto": "123123123",
    "direccion": "Calle Falsa 123",
    "correo": "info@tallerb.cl"
}
```

### 4. Actualizar un Taller
- **Endpoint:** `PATCH /api/taller/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un taller existente.
- **JSON Body:**
```json
{
    "tipo": "Reparaciones",
    "razon_social": "Taller Actualizado",
    "telefono": "111222333",
    "correo": "nuevo@taller.cl"
}
```

#### Respuesta
```json
{
    "id": 1,
    "tipo": "Reparaciones",
    "razon_social": "Taller Actualizado",
    "rut": "12345678-9",
    "telefono": "111222333",
    "contacto": "Juan Pérez",
    "tel_contacto": "987654321",
    "direccion": "Av. Siempre Viva 742",
    "correo": "nuevo@taller.cl"
}
```

### 5. Eliminar un Taller
- **Endpoint:** `DELETE /api/taller/:id`
- **Método:** DELETE
- **Descripción:** Marca un taller como eliminado.

#### Respuesta
```json
{
    "message": "Taller eliminado correctamente."
}
```