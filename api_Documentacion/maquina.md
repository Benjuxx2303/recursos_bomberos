# Máquina

## Endpoints

### 1. Obtener Máquinas con Paginación
- **Endpoint:** `GET /maquina`
- **Método:** GET
- **Descripción:** Obtiene todas las máquinas con paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).

#### Respuesta
```json
{
    "formattedRows": [
        {
            "id": 1,
            "disponible": 1,
            "codigo": "M-001",
            "patente": "AB123CD",
            "num_chasis": "CH123456",
            "vin": "VIN123456789",
            "bomba": 1,
            "hmetro_bomba": 100,
            "hmetro_motor": 200,
            "kmetraje": 3000,
            "num_motor": "MOTOR123",
            "peso_kg": 5000,
            "ven_patente": "01-01-2025",
            "cost_rev_tec": 1000,
            "ven_rev_tec": "01-01-2024",
            "cost_seg_auto": 500,
            "ven_seg_auto": "01-01-2024",
            "modelo": "Modelo A",
            "tipo_maquina": "Tipo A",
            "compania": "Compañía A",
            "procedencia": "Nacional",
            "img_url": "http://example.com/image.jpg"
        },
    ],
    "totalRecords": 100,
    "totalPages": 10,
    "currentPage": 1
}
```

### 2. Obtener Detalles de la Máquina por ID
- **Endpoint:** `GET /maquina/:id`
- **Método:** GET
- **Descripción:** Obtiene los detalles de una máquina específica por ID.

#### Respuesta
```json
{
    "maquina_id": 1,
    "disponible": 1,
    "codigo": "M-001",
    "patente": "AB123CD",
    "num_chasis": "CH123456",
    "vin": "VIN123456789",
    "bomba": 1,
    "hmetro_bomba": 100,
    "hmetro_motor": 200,
    "kmetraje": 3000,
    "num_motor": "MOTOR123",
    "ven_patente": "01-01-2025",
    "cost_rev_tec": 1000,
    "ven_rev_tec": "01-01-2024",
    "cost_seg_auto": 500,
    "ven_seg_auto": "01-01-2024",
    "tipo_maquina_id": 1,
    "tipo_maquina": "Tipo A",
    "compania_id": 1,
    "compania": "Compañía A",
    "procedencia": "Nacional",
    "img_url": "http://example.com/image.jpg",
    "conductores": []
}
```

### 3. Crear una Nueva Máquina
- **Endpoint:** `POST /maquina`
- **Método:** POST
- **Descripción:** Crea una nueva máquina.
- **JSON Body:**
```json
{
    "compania_id": 1,
    "modelo_id": 1,
    "codigo": "M-001",
    "patente": "AB123CD",
    "num_chasis": "CH123456",
    "vin": "VIN123456789",
    "bomba": 1,
    "hmetro_bomba": 100,
    "hmetro_motor": 200,
    "kmetraje": 3000,
    "num_motor": "MOTOR123",
    "ven_patente": "01-01-2025",
    "procedencia_id": 1,
    "cost_rev_tec": 1000,
    "ven_rev_tec": "01-01-2024",
    "cost_seg_auto": 500,
    "ven_seg_auto": "01-01-2024",
    "peso_kg": 5000,
    "nombre": "Máquina A"
}
```

#### Respuesta
```json
{
    "id": 1,
    "compania_id": 1,
    "modelo_id": 1,
    "codigo": "M-001",
    "patente": "AB123CD",
    "nombre": "Máquina A"
}
```

### 4. Eliminar una Máquina
- **Endpoint:** `DELETE /maquina/:id`
- **Método:** DELETE
- **Descripción:** Marca una máquina como eliminada.

#### Respuesta
```json
{
    "message": "Máquina eliminada correctamente."
}
```

### 5. Actualizar una Máquina
- **Endpoint:** `PATCH /maquina/:id`
- **Método:** PATCH
- **Descripción:** Actualiza una máquina existente.
- **JSON Body:**
```json
{
    "compania_id": 1,
    "modelo_id": 1,
    "codigo": "M-002",
    "patente": "AB124CD",
    "num_chasis": "CH654321",
    "vin": "VIN987654321",
    "bomba": 1,
    "hmetro_bomba": 150,
    "hmetro_motor": 250,
    "kmetraje": 4000,
    "num_motor": "MOTOR456",
    "ven_patente": "01-01-2026",
    "procedencia_id": 1,
    "cost_rev_tec": 1200,
    "ven_rev_tec": "01-01-2025",
    "cost_seg_auto": 600,
    "ven_seg_auto": "01-01-2025",
    "peso_kg": 5500,
    "img_url": "http://example.com/new_image.jpg"
}
```

#### Respuesta
```json
{
    "id": 1,
    "compania_id": 1,
    "modelo_id": 1,
    "codigo": "M-002",
    "patente": "AB124CD",
    "nombre": "Máquina A"
}
```

### 6. Asignar Conductores a una Máquina
- **Endpoint:** `POST /maquina/asignar-conductores`
- **Método:** POST
- **Descripción:** Asigna uno o más conductores a una máquina.
- **JSON Body:**
```json
{
    "maquina_id": 1,
    "conductores": [1, 2, 3]
}
```

#### Respuesta
```json
{
    "message": "Conductores asignados exitosamente",
    "data": {
        "maquina_id": 1,
        "conductores_asignados": [1, 2, 3]
    }
}
```

### 7. Activar Máquina por Patente
- **Endpoint:** `PATCH /maquina/activar/:patente`
- **Método:** PATCH
- **Descripción:** Activa una máquina usando su patente.

#### Respuesta
```json
{
    "message": "Máquina activada con éxito"
}
```