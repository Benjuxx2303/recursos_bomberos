# Compañía

## Endpoints

### 1. Obtener Compañías con Paginación
- **Endpoint:** `GET /compania`
- **Método:** GET
- **Descripción:** Obtiene todas las compañías con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1)
  - `pageSize`: Tamaño de la página (opcional, por defecto 10)

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Compañía A",
        "direccion": "Dirección A",
        "img_url": "http://example.com/image.jpg",
        "isDeleted": 0
    },
]
```

### 2. Obtener Compañía por ID
- **Endpoint:** `GET /compania/:id`
- **Método:** GET
- **Descripción:** Obtiene una compañía específica por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Compañía A",
    "direccion": "Dirección A",
    "img_url": "http://example.com/image.jpg",
    "isDeleted": 0
}
```

### 3. Crear Nueva Compañía
- **Endpoint:** `POST /compania`
- **Método:** POST
- **Descripción:** Crea una nueva compañía.
- **JSON Body:**
```json
{
    "nombre": "Compañía B",
    "direccion": "Dirección B"
}
```

#### Respuesta
```json
{
    "id": 2,
    "nombre": "Compañía B",
    "direccion": "Dirección B",
    "img_url": "http://example.com/image.jpg",
    "isDeleted": 0
}
```

### 4. Dar de Baja una Compañía
- **Endpoint:** `DELETE /compania/:id`
- **Método:** DELETE
- **Descripción:** Marca una compañía como eliminada.

#### Respuesta
```json
{
    "message": "Compañía eliminada correctamente."
}
```

### 5. Actualizar una Compañía
- **Endpoint:** `PATCH /compania/:id`
- **Método:** PATCH
- **Descripción:** Actualiza una compañía existente.
- **JSON Body:**
```json
{
    "nombre": "Compañía Actualizada",
    "direccion": "Dirección Actualizada",
    "isDeleted": 0
}
```

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Compañía Actualizada",
    "direccion": "Dirección Actualizada",
    "img_url": "http://example.com/image.jpg",
    "isDeleted": 0
}
```