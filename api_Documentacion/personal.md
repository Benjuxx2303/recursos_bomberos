# Personal

## Endpoints

### 1. Obtener Todos los Personal con Detalles
- **Endpoint:** `GET /personal`
- **Método:** GET
- **Descripción:** Devuelve todos los registros de personal con detalles y paginación.
- **Query Params:**
  - `page`: Número de página (opcional, por defecto 1).
  - `pageSize`: Tamaño de la página (opcional, por defecto 10).
  - `compania_id`: ID de la compañía (opcional).
  - `maquina_id`: ID de la máquina (opcional).
  - `rol_personal_id`: ID del rol del personal (opcional).
  - `nombre`: Nombre del personal (opcional).
  - `disponible`: Estado de disponibilidad (opcional).
  - `rut`: RUT del personal (opcional).

#### Respuesta
```json
[
    {
        "id": 1,
        "disponible": 1,
        "rut": "23904666-5",
        "nombre": "Juan",
        "apellido": "Pérez",
        "fec_nac": "01-01-1985",
        "fec_ingreso": "01-01-2020",
        "img_url": "http://example.com/image.jpg",
        "obs": "Sin observaciones",
        "rol_personal": "Conductor",
        "compania": "Compañía A",
        "ven_licencia": "01-01-2025",
        "imgLicencia": null,
        "ultima_fec_servicio": "01-01-2023 10:00",
        "horas_desde_ultimo_servicio": 100,
        "antiguedad": 24,
        "maquinas_ids": [1, 2]
    },
]
```

### 2. Obtener Personal por ID
- **Endpoint:** `GET /personal/:id`
- **Método:** GET
- **Descripción:** Devuelve un registro de personal específico por ID.

#### Respuesta
```json
{
    "id": 1,
    "disponible": 1,
    "rut": "23904666-5",
    "nombre": "Juan",
    "apellido": "Pérez",
    "fec_nac": "01-01-1985",
    "fec_ingreso": "01-01-2020",
    "img_url": "http://example.com/image.jpg",
    "obs": "Sin observaciones",
    "rol_personal": "Conductor",
    "compania": "Compañía A",
    "ven_licencia": "01-01-2025",
    "imgLicencia": null,
    "ultima_fec_servicio": "01-01-2023 10:00",
    "horas_desde_ultimo_servicio": 100,
    "antiguedad": 24,
    "maquinas_ids": [1, 2]
}
```

### 3. Crear un Nuevo Personal
- **Endpoint:** `POST /personal`
- **Método:** POST
- **Descripción:** Crea un nuevo registro de personal.
- **JSON Body:**
```json
{
    "rol_personal_id": 1,
    "rut": "23904666-5",
    "nombre": "Juan",
    "apellido": "Pérez",
    "compania_id": 1,
    "fec_nac": "01-01-1985",
    "obs": "Sin observaciones",
    "fec_ingreso": "01-01-2020",
    "ven_licencia": "01-01-2025"
}
```

#### Respuesta
```json
{
    "id": 2,
    "rol_personal_id": 1,
    "rut": "23904666-5",
    "nombre": "Juan",
    "apellido": "Pérez",
    "compania_id": 1,
    "fec_nac": "01-01-1985",
    "obs": "Sin observaciones",
    "fec_ingreso": "01-01-2020",
    "ven_licencia": "01-01-2025",
    "img_url": null,
    "imgLicencia": null,
    "ultima_fec_servicio": null
}
```

### 4. Actualizar un Registro de Personal
- **Endpoint:** `PATCH /personal/:id`
- **Método:** PATCH
- **Descripción:** Actualiza un registro de personal existente.
- **JSON Body:**
```json
{
    "rol_personal_id": 1,
    "rut": "23904666-5",
    "nombre": "Juan",
    "apellido": "Pérez",
    "compania_id": 1,
    "fec_nac": "01-01-1985",
    "obs": "Observaciones actualizadas",
    "ven_licencia": "01-01-2026"
}
```

#### Respuesta
```json
{
    "id": 1,
    "rol_personal_id": 1,
    "rut": "23904666-5",
    "nombre": "Juan",
    "apellido": "Pérez",
    "compania_id": 1,
    "fec_nac": "01-01-1985",
    "obs": "Observaciones actualizadas",
    "ven_licencia": "01-01-2026",
    "img_url": "http://example.com/image.jpg"
}
```

### 5. Dar de Baja un Personal
- **Endpoint:** `DELETE /personal/:id`
- **Método:** DELETE
- **Descripción:** Marca un registro de personal como eliminado.

#### Respuesta
```json
{
    "message": "Personal eliminado correctamente."
}
```

### 6. Activar Personal
- **Endpoint:** `PATCH /personal/activate`
- **Método:** PATCH
- **Descripción:** Activa un registro de personal por ID o RUT.
- **Query Params:**
  - `id`: ID del personal (opcional).
  - `rut`: RUT del personal (opcional).

#### Respuesta
```json
{
    "message": "Personal activado exitosamente"
}
```

### 7. Desactivar Personal
- **Endpoint:** `PATCH /personal/deactivate`
- **Método:** PATCH
- **Descripción:** Desactiva un registro de personal por ID o RUT.
- **Query Params:**
  - `id`: ID del personal (opcional).
  - `rut`: RUT del personal (opcional).

#### Respuesta
```json
{
    "message": "Personal desactivado exitosamente"
}
```

### 8. Actualizar Última Fecha de Servicio
- **Endpoint:** `GET /personal/update-last-service-date`
- **Método:** GET
- **Descripción:** Actualiza la última fecha de servicio para todos los registros de personal.

#### Respuesta
```json
{
    "message": "Campo ultima_fec_servicio actualizado correctamente para todos los registros."
}
```