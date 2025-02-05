
# Conductor Máquina

## Endpoints

### 1. Obtener Conductores de Máquina con Paginación
- **Endpoint:** `GET /api/conductor_maquina`
- **Método:** GET
- **Descripción:** Obtiene todos los registros de conductor máquina con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1)
  - `pageSize`: Tamaño de la página (opcional, por defecto 10)

#### Respuesta
```json
[
    {
        "id": 1,
        "personal_id": 1,
        "maquina_id": 1,
        "isDeleted": 0
    },
    ...
]
```

### 2. Obtener Conductor de Máquina por ID
- **Endpoint:** `GET /api/conductor_maquina/:id`
- **Método:** GET
- **Descripción:** Obtiene un registro específico de conductor máquina por ID.

#### Respuesta
```json
{
    "id": 1,
    "personal_id": 1,
    "maquina_id": 1,
    "isDeleted": 0
}
```

### 3. Crear un Nuevo Conductor de Máquina
- **Endpoint:** `POST /api/conductor_maquina`
- **Método:** POST
- **Descripción:** Crea un nuevo registro de conductor máquina.
- **JSON Body:**
```json
{
    "personal_id": 1,
    "maquina_id": 1
}
```

#### Respuesta
```json
{
    "id": 1,
    "personal_id": 1,
    "maquina_id": 1
}
```

### 4. Dar de Baja un Conductor de Máquina
- **Endpoint:** `DELETE /api/conductor_maquina/:id`
- **Método:** DELETE
- **Descripción:** Marca un registro de conductor máquina como eliminado.

#### Respuesta
```json
{
    "message": "Conductor de máquina eliminado correctamente."
}
```

### 5. Actualizar un Conductor de Máquina
- **Endpoint:** `PATCH /api/conductor_maquina/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un registro de conductor máquina existente.
- **JSON Body:**
```json
{
    "personal_id": 2,
    "maquina_id": 2,
    "isDeleted": 0
}
```

#### Respuesta
```json
{
    "id": 1,
    "personal_id": 2,
    "maquina_id": 2
}
```