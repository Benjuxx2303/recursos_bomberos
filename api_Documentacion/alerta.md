# Alertas

## Endpoints

### 1. Obtener Alertas por Usuario
- **Endpoint:** `GET /api/alerta/usuario/:usuario_id`
- **Método:** GET
- **Descripción:** Obtiene las alertas del usuario especificado por `usuario_id`.

#### Respuesta
```json
[
    {
        "id": 1,
        "contenido": "Alerta de ejemplo",
        "createdAt": "01-01-2022 10:00",
        "tipo": "mantencion",
        "isRead": 0
    },
]
```

---

### 2. Marcar Todas las Alertas como Leídas
- **Endpoint:** `PUT /api/alerta/usuario/:usuario_id/read`
- **Método:** PUT
- **Descripción:** Marca todas las alertas del usuario especificado como leídas.

#### JSON Body
```json
{
    "usuario_id": 1
}
```

#### Respuesta
```json
{
    "message": "Todas las alertas marcadas como leídas",
    "count": 5
}
```

---

### 3. Marcar Alerta como Leída
- **Endpoint:** `PUT /api/alerta/:alerta_id/read`
- **Método:** PUT
- **Descripción:** Marca una alerta específica como leída.

#### JSON Body
```json
{
    "usuario_id": 1
}
```

#### Respuesta
```json
{
    "message": "Alerta marcada como leída"
}
```

---

### 4. Enviar Alertas de Vencimiento
- **Endpoint:** `GET /api/alerta/vencimientos`
- **Método:** GET
- **Descripción:** Envía alertas de vencimiento a los usuarios.

#### Respuesta
```json
{
    "message": "Alertas enviadas y almacenadas correctamente."
}
```

---

### 5. Enviar Alertas de Revisión Técnica
- **Endpoint:** `GET /api/alerta/revision-tecnica`
- **Método:** GET
- **Descripción:** Envía alertas sobre vencimientos de revisión técnica a los conductores asignados.

#### Respuesta
```json
{
    "message": "Alertas enviadas y almacenadas correctamente."
}
```

---

### 6. Enviar Alertas de Mantención
- **Endpoint:** `GET /api/alerta/mantencion`
- **Método:** GET
- **Descripción:** Envía alertas sobre mantenciones pendientes.

#### Respuesta
```json
{
    "message": "Alertas enviadas y almacenadas correctamente."
}
```

---

### 7. Enviar Alertas de Próximas Mantenciones
- **Endpoint:** `GET /api/alerta/proximas-mantenciones`
- **Método:** GET
- **Descripción:** Envía alertas sobre próximas mantenciones.

#### Respuesta
```json
{
    "message": "Alertas de mantenciones enviadas correctamente"
}
```

---

### 8. Eliminar Alertas Antiguas
- **Endpoint:** `DELETE /api/alerta/limpiar`
- **Método:** (No definido en las rutas, pero es parte de la lógica)
- **Descripción:** Elimina alertas que tienen más de 30 días.

#### Respuesta
```json
{
    "message": "Alertas antiguas eliminadas."
}
```