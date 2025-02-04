# Stats Mantenciones

## Endpoints

### 1. Obtener Calendario de Mantenciones
- **Endpoint:** `GET /api/stats-mantenciones/calendar-maintenances`
- **Método:** GET
- **Descripción:** Devuelve el calendario de mantenciones.

#### Respuesta
```json
{
    "data": [
        {
            "fecha": "2023-01-15",
            "tipo_mantenimiento": "Preventiva"
        },
    ]
}
```

### 2. Obtener Estadísticas Mensuales de Mantenciones
- **Endpoint:** `GET /api/stats-mantenciones/monthly-stats`
- **Método:** GET
- **Descripción:** Devuelve estadísticas mensuales de mantenciones.

#### Respuesta
```json
{
    "year": 2023,
    "meses": [
        {
            "mes": "Enero",
            "costoTotal": 15000,
            "totalMantenciones": 10
        },
    ]
}
```

### 3. Obtener KPIs de Mantenciones
- **Endpoint:** `GET /api/stats-mantenciones/kpis`
- **Método:** GET
- **Descripción:** Devuelve indicadores clave de rendimiento (KPIs) relacionados con las mantenciones.

#### Respuesta
```json
{
    "kpi": {
        "totalMantenciones": 200,
        "costoPromedio": 500,
        "mantencionesPendientes": 5
    }
}
```

### 4. Obtener Mantenciones por Compañía
- **Endpoint:** `GET /api/stats-mantenciones/by-company`
- **Método:** GET
- **Descripción:** Devuelve datos de mantenciones filtrados por compañía.

#### Respuesta
```json
{
    "data": [
        {
            "compania": "Compañía A",
            "totalMantenciones": 50,
            "costoTotal": 20000
        },
    ]
}
```

### 5. Obtener Historial de Mantenciones
- **Endpoint:** `GET /api/stats-mantenciones/maintenance-history`
- **Método:** GET
- **Descripción:** Devuelve el historial de mantenciones.

#### Respuesta
```json
{
    "data": [
        {
            "id": 1,
            "fecha": "2023-01-15",
            "estado": "Completada",
            "costo": 1500
        },
    ]
}
```

### 6. Obtener Costos de Mantenciones por Año
- **Endpoint:** `GET /api/stats-mantenciones/costos`
- **Método:** GET
- **Descripción:** Devuelve los costos de mantenciones filtrados por año.
- **Query Params:**
  - `year`: Año a filtrar (formato `YYYY`).

#### Respuesta
```json
{
    "year": 2023,
    "meses": [
        {
            "mes": "Enero",
            "costoTotal": 15000,
            "totalMantenciones": 10
        },
    ]
}
```

### 7. Obtener Reporte de Mantenciones por Estado y Costo
- **Endpoint:** `GET /api/stats-mantenciones/reporte`
- **Método:** GET
- **Descripción:** Devuelve un reporte de mantenciones filtrado por fechas y compañía.
- **Query Params:**
  - `startDate`: Fecha de inicio (formato `dd-mm-yyyy`).
  - `endDate`: Fecha de fin (formato `dd-mm-yyyy`).
  - `companiaId`: ID de la compañía (opcional).

#### Respuesta
```json
{
    "estadoMensual": {
        "2023": {
            "enero": {
                "completada": { "count": 5, "cost": 10000 },
                "abierta": { "count": 2, "cost": 5000 }
            },
        }
    },
    "tiposMantenciones": {
        "preventiva": { "cantidad": 30, "porcentaje": 0.75 },
    },
    "estadoFlota": {
        "disponible": { "cantidad": 10, "porcentaje": 0.50 },
        "noDisponible": { "cantidad": 10, "porcentaje": 0.50 }
    }
}
```

### 8. Obtener Resumen General de Mantenciones
- **Endpoint:** `GET /api/stats-mantenciones/resumen`
- **Método:** GET
- **Descripción:** Devuelve un resumen general de las mantenciones.

#### Respuesta
```json
{
    "totalMaquinas": 20,
    "maquinasActivas": 15,
    "mantencionesProximas": 3,
    "mantencionesAbiertas": 2,
    "mantencionesCompletadas": 5,
    "mantencionesAtrasadas": 1,
    "eficiencia": {
        "tiempoResolucionPromedio": 3,
        "porcentajePreventivas": 60,
        "flotaDisponible": 75
    }
}
```