# 1. rol_personal
### "/api/rol_personal"
```
{
    "nombre": "Rol 1",
    "descripcion": "Rol de prueba"
}
```

# 2. compania
### "/api/compania"
```
{
    "nombre": "Compañia 1"
}
```

# 3. personal
### "/api/personal"
```
{
    "rol_personal_id": 1,
    "rut": "12.345.678-9",
    "nombre": "Juan",
    "apellido": "Zarate",
    "compania_id": 1,
    "fec_nac": "01-01-1990"
}
```
# 3.1. actualizar imagenes
### Método PATCH
### Endpoint: `/api/personal/:id/image`

##### Descripción
Actualiza la imagen asociada al personal especificado por el ID.

##### Parámetros
- **URL Params**
  - `id`: ID del personal cuya imagen se desea actualizar (requerido).

##### Body
Se debe enviar un archivo en `form-data` con la clave `file`.

###### Ejemplo de `form-data`
| Clave | Tipo   | Descripción                |
|-------|--------|----------------------------|
| file  | archivo| Archivo de imagen a subir. |

# 4. estado_mantencion
### "/api/estado_mantencion"
```
{
    nombre: "Pendiente",
    descripcion: "algo"
}
```

# 5. clave
### "/api/clave"
```
{
    "codigo": "0001",
    "descripcion": "algo"
}
```

# 6. tipo_maquina
### "/api/tipo_maquina"
```
{
    "clasificacion": "tipo maquina 1"
}
```

# 7. procedencia
### "/api/procedencia"
```
{
    "nombre": "procedencia 1"
}
```

# 8. maquina
### "/api/maquina"
```
{
  "tipo_maquina_id": 1,
  "compania_id": 1,
  "codigo": "codigo 1",
  "patente": "AABB11",
  "num_chasis": "CM82633A123456",
  "vin": "1HGCM82633A123456",
  "bomba": 1,
  "hmetro_bomba": 10.0,
  "hmetro_motor": 5.0,
  "kmetraje": 50.0,
  "num_motor": "4G63T1234567",
  "ven_patente": "23-05-2026",
  "procedencia_id": 1,
  "cost_rev_tec": 80000,
  "ven_rev_tec": "05-10-2025",
  "cost_seg_auto": 120000,
  "ven_seg_auto": "12-01-2026"
}
```

# 9. taller
### "/api/taller"
```
{
  "nombre": "test",
  "fono": "12345678"
}
```

# 10. conductor_maquina
### "/api/conductor_maquina"
```
{
  "personal_id": 1,
  "maquina_id": 1,
  "tipo_maquina_id": 1,
  "ven_licencia": "31-12-2025"
}
```

# 11. bitacora
### "/api/bitacora"
```
{
  "compania_id": 2,
  "conductor_id": 1,
  "direccion": "123 Calle Ejemplo",
  "fecha": "28-10-2024",
  "h_salida": "08:00",
  "h_llegada": "12:00",
  "clave_id": 1,
  "km_salida": 100.5,
  "km_llegada": 150.75,
  "hmetro_salida": 8.5,
  "hmetro_llegada": 12.5,
  "hbomba_salida": 9.0,
  "hbomba_llegada": 13.0,
  "obs": "Observaciones sobre el viaje"
}
```

# 12. mantencion
### "/api/mantencion"
```
{
    "bitacora_id": 1,
    "maquina_id": 1,
    "personal_id_responsable": 6,
    "compania_id": 1,
    "ord_trabajo": "OT-12345",
    "n_factura": "F-98765",
    "cost_ser": 1500.00,
    "taller_id": 5,
    "estado_mantencion_id": 1
}
```

# 13. tipo_mantencion
### "/api/tipo_mantencion"
```
{
    "nombre": "tipo_mantencion 1"
}
```

# 14.1 usuario (register)
### "/api/usuario/register"
```
{
    "username": "juanPerez",
    "correo": "test2@test.cl",
    "contrasena": "test123",
    "personal_id": 1
}
```

# 14.1 usuario (login)
### "/api/usuario/login"
```
{
    "username": "juanPerez",
    "contrasena": "test123"
}
```

# 15. division
### "/api/division"
```
{
    "nombre": "test_division1"
}
```

# 16. subdivision
### "/api/subdivision"
```
{
    "division_id": 1,
    "nombre": "test_SUBdivision1"
}
```

# 17. servicio
### "/api/servicio"
```
{
    "subdivision_id": 1,
    "descripcion": "servicio 1"
}
```

# 18. detalle_mantencion
### "/api/detalle_mantencion"
```
{
    "mantencion_id": 1,
    "tipo_mantencion_id": 2,
    "observacion": "Detalles de la mantención",
    "servicio_id": 3
}
```

# 19. carga_combustible
### "/api/carga_combustible"
```
{
    "maquina_id": 1,
    "litros": 50.00,
    "valor_mon": 1000
}
```
