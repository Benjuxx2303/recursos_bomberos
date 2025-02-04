# Tipo Máquina

## Endpoints

### 1. Obtener Todos los Tipos de Máquina con Paginación
- **Endpoint:** `GET /api/tipo_maquina`
- **Método:** GET
- **Descripción:** Devuelve todos los tipos de máquina activos con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).

#### Respuesta
```json
[
    {
        "id": 1,
        "nombre": "Excavadora"
    },
]
```

### 2. Obtener Tipo de Máquina por ID
- **Endpoint:** `GET /api/tipo_maquina/:id`
- **Método:** GET
- **Descripción:** Devuelve un tipo de máquina específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Excavadora"
}
```

### 3. Crear un Nuevo Tipo de Máquina
- **Endpoint:** `POST /api/tipo_maquina`
- **Método:** POST
- **Descripción:** Crea un nuevo tipo de máquina.
- **JSON Body:**
```json
{
    "nombre": "Bulldozer",
    "descripcion": "Máquina para mover tierra."
}
```

#### Respuesta
```json
{
    "id": 2,
    "nombre": "Bulldozer"
}
```

### 4. Actualizar un Tipo de Máquina
- **Endpoint:** `PATCH /api/tipo_maquina/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un tipo de máquina existente.
- **JSON Body:**
```json
{
    "nombre": "Bulldozer Actualizado",
    "descripcion": "Descripción actualizada."
}
```

#### Respuesta
```json
{
    "id": 1,
    "nombre": "Bulldozer Actualizado"
}
```

### 5. Eliminar un Tipo de Máquina
- **Endpoint:** `DELETE /api/tipo_maquina/:id`
- **Método:** DELETE
- **Descripción:** Marca un tipo de máquina como eliminado.

#### Respuesta
```json
{
    "message": "Tipo de máquina eliminado correctamente."
}
```