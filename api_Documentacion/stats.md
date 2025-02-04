# STATS

## Endpoints

### 1. Obtener Datos de Mantenimiento
- **Endpoint:** `GET /stats/maintenance`
- **Método:** GET
- **Descripción:** Devuelve datos de mantenimiento filtrados por fecha, compañía y máquina.
- **Query Params:**
  - `startDate`: Fecha de inicio (opcional).
  - `endDate`: Fecha de fin (opcional).
  - `companiaId`: ID de la compañía (opcional).
  - `maquinaId`: ID de la máquina (opcional).

#### Respuesta
```json
{
    "data": [
        {
            "month": "Ene",
            "tipo_mantencion": "Tipo A",
            "total": 5
        },
    ]
}
```

### 2. Obtener Datos de Servicio
- **Endpoint:** `GET /stats/service`
- **Método:** GET
- **Descripción:** Devuelve datos de servicio filtrados por fecha, compañía y máquina.
- **Query Params:**
  - `startDate`: Fecha de inicio (opcional).
  - `endDate`: Fecha de fin (opcional).
  - `companiaId`: ID de la compañía (opcional).
  - `maquinaId`: ID de la máquina (opcional).

#### Respuesta
```json
[
    {
        "month": "Ene",
        "incendios": 3,
        "rescates": 2,
        "otros": 1
    },
]
```

### 3. Obtener Datos de Servicio con Claves
- **Endpoint:** `GET /stats/service`
- **Método:** GET
- **Descripción:** Devuelve datos de servicio con claves filtrados por fecha, compañía y máquina.
- **Query Params:**
  - `startDate`: Fecha de inicio (opcional).
  - `endDate`: Fecha de fin (opcional).
  - `companiaId`: ID de la compañía (opcional).
  - `maquinaId`: ID de la máquina (opcional).

#### Respuesta
```json
{
    "data": [
        {
            "month": "Ene",
            "tipo_clave": "Clave A",
            "total": 4
        },
    ]
}
```

### 4. Obtener Datos de Combustible
- **Endpoint:** `GET /stats/fuel`
- **Método:** GET
- **Descripción:** Devuelve datos de consumo de combustible filtrados por fecha, compañía y máquina.
- **Query Params:**
  - `startDate`: Fecha de inicio (opcional).
  - `endDate`: Fecha de fin (opcional).
  - `companiaId`: ID de la compañía (opcional).
  - `maquinaId`: ID de la máquina (opcional).

#### Respuesta
```json
{
    "data": [
        {
            "month": "Ene",
            "companias": [
                {
                    "name": "Compañía A",
                    "litros": 500
                },
            ]
        },
    ]
}
```

### 5. Obtener Datos de Compañía
- **Endpoint:** `GET /stats/company`
- **Método:** GET
- **Descripción:** Devuelve datos de las compañías filtrados por fecha.
- **Query Params:**
  - `startDate`: Fecha de inicio (opcional).
  - `endDate`: Fecha de fin (opcional).

#### Respuesta
```json
{
    "data": [
        {
            "name": "Compañía A",
            "servicios": 10,
            "maquinas": 5,
            "personal": 15,
            "promedioMinutosServicio": 30.5
        },
    ]
}
```

### 6. Obtener Datos de Conductores
- **Endpoint:** `GET /stats/driver`
- **Método:** GET
- **Descripción:** Devuelve datos de los conductores filtrados por fecha, compañía y máquina.
- **Query Params:**
  - `startDate`: Fecha de inicio (opcional).
  - `endDate`: Fecha de fin (opcional).
  - `companiaId`: ID de la compañía (opcional).
  - `maquinaId`: ID de la máquina (opcional).

#### Respuesta
```json
{
    "data": [
        {
            "id": 1,
            "nombre": "Conductor A",
            "compania": "Compañía A",
            "servicios": 8,
            "maquinasConducidas": 3,
            "promedioMinutosServicio": 45.2
        },
    ]
}
```

### 7. Obtener Datos Resumen
- **Endpoint:** `GET /stats/summary`
- **Método:** GET
- **Descripción:** Devuelve un resumen de datos relacionados con mantenimiento, servicios, combustible, compañías y conductores.

#### Respuesta
```json
{
    "success": true,
    "data": {
        "pendingMaintenance": 5,
        "servicesThisMonth": 12,
        "fuelConsumption": 2500,
        "totalCompanies": 8,
        "activeDrivers": 20
    }
}
```