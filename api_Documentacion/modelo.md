# Modelo

## Endpoints

### 1. Obtener Todos los Modelos
- **Endpoint:** `GET /modelo`
- **Método:** GET
- **Descripción:** Devuelve todos los modelos sin paginación.

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Modelo A",
        "peso_kg": 5000,
        "img_url": "http://example.com/image.jpg",
        "marca_id": 1,
        "marca": "Marca A",
        "tipo_maquina_id": 1,
        "tipo_maquina": "Tipo A",
        "tipo_maquina_descripcion": "Descripción del tipo A"
    },
]
```

### 2. Obtener Modelos con Paginación
- **Endpoint:** `GET /modelo/page`
- **Método:** GET
- **Descripción:** Devuelve modelos con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).
  - `marca_id`: ID de la marca (opcional).
  - `tipo_maquina_id`: ID del tipo de máquina (opcional).

#### Respuesta
```json
{
    "data": [
        {
            "id": 1,
            "nombre": "Modelo A",
            "peso_kg": 5000,
            "img_url": "http://example.com/image.jpg",
            "marca_id": 1,
            "marca": "Marca A",
            "tipo_maquina_id": 1,
            "tipo_maquina": "Tipo A",
            "tipo_maquina_descripcion": "Descripción del tipo A"
        },
    ],
    "pagination": {
        "page": 1,
        "pageSize": 10,
        "total": 100,
        "totalPages": 10
    }
}
```

### 3. Obtener Modelo por ID
- **Endpoint:** `GET /modelo/:id`
- **Método:** GET
- **Descripción:** Devuelve un modelo específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Modelo A",
    "peso_kg": 5000,
    "img_url": "http://example.com/image.jpg",
    "marca": "Marca A",
    "tipo_maquina": "Tipo A",
    "tipo_maquina_descripcion": "Descripción del tipo A"
}
```

### 4. Crear un Nuevo Modelo
- **Endpoint:** `POST /modelo`
- **Método:** POST
- **Descripción:** Crea un nuevo modelo.
- **JSON Body:**
```json
{
    "nombre": "Modelo B",
    "marca_id": 1,
    "tipo_maquina_id": 1,
    "peso_kg": 4500
}
```

#### Respuesta
```json
{
    "id": 2,
    "nombre": "Modelo B",
    "marca_id": 1,
    "tipo_maquina_id": 1,
    "peso_kg": 4500,
    "img_url": null
}
```

### 5. Actualizar un Modelo
- **Endpoint:** `PATCH /modelo/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un modelo existente.
- **JSON Body:**
```json
{
    "nombre": "Modelo Actualizado",
    "marca_id": 1,
    "tipo_maquina_id": 2,
    "peso_kg": 4800
}
```

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Modelo Actualizado",
    "marca_id": 1,
    "tipo_maquina_id": 2,
    "peso_kg": 4800
}
```

### 6. Eliminar un Modelo
- **Endpoint:** `DELETE /modelo/:id`
- **Método:** DELETE
- **Descripción:** Marca un modelo como eliminado.

#### Respuesta
```json
{
    "message": "Modelo eliminado correctamente."
}
```