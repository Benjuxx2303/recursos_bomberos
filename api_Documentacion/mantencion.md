# Mantención

## Endpoints

### 1. Descargar Excel de Mantenciones
- **Endpoint:** `GET /api/mantencion/excel`
- **Método:** GET
- **Descripción:** Descarga un archivo Excel con los detalles de las mantenciones.
- **Query Params:**
  - `fields`: Campos a incluir en el Excel.
  - `taller`: Nombre del taller (opcional).
  - `estado_mantencion`: Estado de la mantención (opcional).
  - `ord_trabajo`: Número de orden de trabajo (opcional).
  - `compania`: Nombre de la compañía (opcional).

#### Respuesta
```json
{
    "message": "Excel descargado correctamente."
}
```

### 2. Obtener Mantenciones con Filtros
- **Endpoint:** `GET /api/mantencion`
- **Método:** GET
- **Descripción:** Obtiene todas las mantenciones con parámetros de búsqueda y paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).
  - `taller`: Nombre del taller (opcional).
  - `estado_mantencion`: Estado de la mantención (opcional).
  - `ord_trabajo`: Número de orden de trabajo (opcional).
  - `compania`: Nombre de la compañía (opcional).

#### Respuesta
```json
[
    {
        "id": 1,
        "bitacora": {
            "id": 1,
            "compania": "Compañía A",
            "conductor": "Conductor A",
            "direccion": "Dirección A",
            "h_salida": "01-01-2024 08:00",
            "h_llegada": "01-01-2024 12:00",
            "km_salida": 100,
            "km_llegada": 150,
            "hmetro_salida": 50,
            "hmetro_llegada": 100,
            "hbomba_salida": 30,
            "hbomba_llegada": 45,
            "obs": "Observaciones"
        },
        "patente": "AB123CD",
        "fec_inicio": "01-01-2024",
        "fec_termino": "01-01-2024",
        "ord_trabajo": "OT-12345",
        "n_factura": "123456",
        "img_url": "http://example.com/image.jpg",
        "cost_ser": 1000,
        "taller": "Taller A",
        "estado_mantencion": "Aprobada",
        "tipo_mantencion": "Preventiva",
        "tipo_mantencion_id": 1
    },
]
```

### 3. Obtener Detalles de Mantención por ID
- **Endpoint:** `GET /api/mantencion/:id`
- **Método:** GET
- **Descripción:** Obtiene todos los detalles de una mantención específica por ID.

#### Respuesta
```json
{
    "id": 1,
    "bitacora": {
        "id": 1,
        "compania": "Compañía A",
        "conductor": "Conductor A",
        "direccion": "Dirección A",
        "h_salida": "01-01-2024 08:00",
        "h_llegada": "01-01-2024 12:00",
        "km_salida": 100,
        "km_llegada": 150,
        "hmetro_salida": 50,
        "hmetro_llegada": 100,
        "hbomba_salida": 30,
        "hbomba_llegada": 45,
        "obs": "Observaciones"
    },
    "patente": "AB123CD",
    "fec_inicio": "01-01-2024",
    "fec_termino": "01-01-2024",
    "ord_trabajo": "OT-12345",
    "n_factura": "123456",
    "cost_ser": 1000,
    "taller": "Taller A",
    "estado_mantencion": "Aprobada",
    "tipo_mantencion": "Preventiva",
    "tipo_mantencion_id": 1
}
```

### 4. Crear una Nueva Mantención
- **Endpoint:** `POST /api/mantencion/old`
- **Método:** POST
- **Descripción:** Crea una nueva mantención.
- **JSON Body:**
```json
{
    "bitacora_id": 1,
    "maquina_id": 1,
    "taller_id": 1,
    "tipo_mantencion_id": 1,
    "fec_inicio": "01-01-2024",
    "fec_termino": "01-01-2024",
    "ord_trabajo": "OT-12345",
    "n_factura": "123456",
    "cost_ser": 1000,
    "aprobada": 1
}
```

#### Respuesta
```json
{
    "id": 1,
    "bitacora_id": 1,
    "maquina_id": 1,
    "taller_id": 1,
    "estado_mantencion_id": 1,
    "tipo_mantencion_id": 1,
    "fec_inicio": "01-01-2024",
    "fec_termino": "01-01-2024",
    "ord_trabajo": "OT-12345",
    "n_factura": "123456",
    "cost_ser": 1000,
    "img_url": null,
    "message": "Mantención creada exitosamente"
}
```

### 5. Eliminar una Mantención
- **Endpoint:** `DELETE /api/mantencion/:id`
- **Método:** DELETE
- **Descripción:** Marca una mantención como eliminada.

#### Respuesta
```json
{
    "message": "Mantención eliminada correctamente."
}
```

### 6. Actualizar una Mantención
- **Endpoint:** `PATCH /api/mantencion/:id`
- **Método:** PATCH
- **Descripción:** Actualiza una mantención existente.
- **JSON Body:**
```json
{
    "bitacora_id": 1,
    "maquina_id": 1,
    "ord_trabajo": "OT-12345",
    "n_factura": "123456",
    "cost_ser": 1000,
    "taller_id": 1,
    "estado_mantencion_id": 1,
    "tipo_mantencion_id": 1,
    "isDeleted": 0,
    "fec_inicio": "01-01-2024",
    "fec_termino": "01-01-2024"
}
```

#### Respuesta
```json
{
    "id": 1,
    "bitacora_id": 1,
    "maquina_id": 1,
    "taller_id": 1,
    "estado_mantencion_id": 1,
    "tipo_mantencion_id": 1,
    "fec_inicio": "01-01-2024",
    "fec_termino": "01-01-2024",
    "ord_trabajo": "OT-12345",
    "n_factura": "123456",
    "cost_ser": 1000,
    "message": "Mantención actualizada exitosamente"
}
```

### 7. Aprobar/Rechazar Mantención
- **Endpoint:** `PATCH /api/mantencion/:id/aprobacion`
- **Método:** PATCH
- **Descripción:** Cambia el estado de aprobación de una mantención.
- **JSON Body:**
```json
{
    "usuario_id": 1
}
```

#### Respuesta
```json
{
    "message": "Mantención aprobada exitosamente",
    "aprobada": 1
}
```

### 8. Actualizar el Estado de una Mantención
- **Endpoint:** `PATCH /api/mantencion/:id/status`
- **Método:** PATCH
- **Descripción:** Actualiza el estado de una mantención.
- **JSON Body:**
```json
{
    "estado_mantencion_id": 2
}
```

#### Respuesta
```json
{
    "message": "Estado de mantención actualizado correctamente"
}
```

### 9. Crear Mantenciones Periódicas
- **Endpoint:** `POST /api/mantencion/periodica`
- **Método:** POST
- **Descripción:** Crea mantenciones periódicas basadas en fechas.
- **JSON Body:**
```json
{
    "maquina_id": 1,
    "taller_id": 1,
    "tipo_mantencion_id": 1,
    "fechas": ["01-01-2024", "01-02-2024"],
    "dias_habiles": true,
    "intervalo_dias": 30,
    "ord_trabajo_base": "OT-12345",
    "cost_ser_estimado": 1000
}
```

#### Respuesta
```json
{
    "message": "Mantenciones periódicas creadas exitosamente",
    "mantenciones": [
        {
            "id": 1,
            "fecha": "01-01-2024",
            "bitacora_id": 1,
            "ord_trabajo": "OT-12345-01-01-2024"
        },
    ]
}
```