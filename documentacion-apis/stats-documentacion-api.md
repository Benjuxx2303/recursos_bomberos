# Documentación de API para el Dashboard de Bomberos Osorno

## Base URL

```
http://localhost:3000/api/stats/
```

Reemplaza `` con la URL base real de tu API.

## Endpoints

### 1. Datos de Mantenimiento

- **URL**: `/maintenance`
- **Método**: `GET`
- **Descripción**: Obtiene los datos de mantenimiento para los últimos 6 meses.
- **Respuesta**:
  ```json
  {
    "data": [
      {
        "month": "Ene",
        "mantenciones": 25
      },
      {
        "month": "Feb",
        "mantenciones": 30
      },
      // ... (datos para los 6 meses más recientes)
    ]
  }
  ```

### 2. Datos de Servicios

- **URL**: `/service`
- **Método**: `GET`
- **Descripción**: Obtiene los datos de servicios realizados para los últimos 6 meses.
- **Respuesta**:
  ```json
  {
    "data": [
      {
        "month": "Ene",
        "servicios": 45
      },
      {
        "month": "Feb",
        "servicios": 38
      },
      // ... (datos para los 6 meses más recientes)
    ]
  }
  ```

### 3. Datos de Combustible

- **URL**: `/fuel`
- **Método**: `GET`
- **Descripción**: Obtiene los datos de consumo de combustible para los últimos 6 meses.
- **Respuesta**:
  ```json
  {
    "data": [
      {
        "month": "Ene",
        "combustible": 1200
      },
      {
        "month": "Feb",
        "combustible": 1150
      },
      // ... (datos para los 6 meses más recientes)
    ]
  }
  ```

### 4. Datos de Compañías

- **URL**: `/company`
- **Método**: `GET`
- **Descripción**: Obtiene los datos de servicios por compañía.
- **Respuesta**:
  ```json
  {
    "data": [
      {
        "name": "Compañía 1",
        "servicios": 50,
        "color": "#FF6384"
      },
      {
        "name": "Compañía 2",
        "servicios": 45,
        "color": "#36A2EB"
      },
      // ... (datos para todas las compañías)
    ]
  }
  ```

### 5. Datos de Conductores

- **URL**: `/driver`
- **Método**: `GET`
- **Descripción**: Obtiene los datos de los conductores.
- **Respuesta**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "nombre": "Juan Pérez",
        "compañia": "Compañía 1",
        "servicios": 20,
        "horas": 100
      },
      {
        "id": 2,
        "nombre": "María González",
        "compañia": "Compañía 2",
        "servicios": 18,
        "horas": 90
      },
      // ... (datos para todos los conductores)
    ]
  }
  ```

## Notas Adicionales

1. Todos los endpoints deben devolver un código de estado HTTP apropiado (por ejemplo, 200 para éxito, 404 para no encontrado, 500 para error del servidor, etc.).

2. Se recomienda implementar paginación para el endpoint de conductores si se espera que la lista sea larga.

3. Para los datos de mantenimiento, servicios y combustible, asegúrese de que siempre se devuelvan los datos de los últimos 6 meses, incluyendo el mes actual.

4. Los colores para las compañías en el endpoint `/company` deben ser consistentes para mantener la coherencia visual en el dashboard.

5. Considere implementar autenticación y autorización para proteger estos endpoints.

6. Para obtener datos en tiempo real o actualizaciones frecuentes, considere implementar websockets o polling en el lado del cliente.
```

Esta documentación proporciona una guía clara sobre cómo estructurar las respuestas de la API para que sean compatibles con el dashboard que hemos creado. Cada endpoint corresponde a una sección específica del dashboard y proporciona los datos necesarios en el formato requerido.