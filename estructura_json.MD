
# ANTES DE PROSEGUIR!
## Recuerda usar el endpoint de "login" para poder acceder a las rutas.
### "/api/usuario/login"
```
{
    "username": "juanPerez",
    "contrasena": "test123"
}
```

# Query Params
### Los siguientes query params estan presentes en todos los endpoints de la api:
###### Ejemplo
| Key       | Value  | Descripción                    |
|-----------|--------|--------------------------------|
| page      | 1      | Numero de pagina               |
| pageSize  | 10     | Limite de registros por página |

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
    "compania_id": 1,
    "rut": "12.345.678-9",
    "nombre": "Juan",
    "apellido": "Zarate",
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
    "nombre": "Test",
    "descripcion": "Test de estado de mantencion"
}
```

# 5. clave
### "/api/clave"
```
{
    "codigo": "0001",
    "descripcion": "Test"
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
  "tipo_maquina_id": 4,
  "compania_id": 13,
  "procedencia_id": 4,
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
  "maquina_id": 1
}
```

# 11. bitacora
### "/api/bitacora"
- Se separaron los campos para fecha y hora. Pero al ingresar los datos, se mostrará como un solo campo.
```
{
    "compania_id": 2,
    "conductor_id": 1,
    "maquina_id": 1,
    "clave_id": 1,
    "direccion": "123 Calle Ejemplo",
    "f_salida": "04-11-2024",
    "h_salida": "08:50",
    "f_llegada": "10-11-2024",
    "h_llegada": "10:50",
    "km_salida": 50.5,
    "km_llegada": 75.0,
    "hmetro_salida": 30.0,
    "hmetro_llegada": 45.0,
    "hbomba_salida": 15.0,
    "hbomba_llegada": 20.0,
    "obs": "Observaciones opcionales"
}
```

# 12. mantencion
### "/api/mantencion"
```
{
    "bitacora": {
        "compania_id": 2,
        "conductor_id": 1,
        "direccion": "Dirección de destino",
        "f_salida": "01-01-2024",
        "h_salida": "08:30",
        "f_llegada": "01-01-2024",
        "h_llegada": "12:45",
        "clave_id": 3,
        "km_salida": 1500,
        "km_llegada": 1600,
        "hmetro_salida": 120.5,
        "hmetro_llegada": 130.7,
        "hbomba_salida": 50,
        "hbomba_llegada": 55.8,
        "obs": "Observaciones adicionales si hay alguna"
    },
    "maquina_id": 1,
    "taller_id": 1,
    "estado_mantencion_id": 6,
    "ord_trabajo": "OT12345",
    "n_factura": 45678,
    "cost_ser": 50000,
    "fec_inicio": "01-01-2024",  // Esta fecha es opcional y debe ser en formato dd-mm-yyyy
    "fec_termino": "02-01-2024"  // Esta fecha es opcional y debe ser en formato dd-mm-yyyy
}
```

# 12.1 mantencion (legacy) POST
### "/api/mantencion/old"
```
{
    "bitacora_id": 85,
    "maquina_id": 8,
    "taller_id": 4,
    "estado_mantencion_id": 13,
    "ord_trabajo": "OT12345",
    "n_factura": 45678,
    "cost_ser": 50000,
    "fec_inicio": "01-01-2024",  // Esta fecha es opcional y debe ser en formato dd-mm-yyyy
    "fec_termino": "02-01-2024"  // Esta fecha es opcional y debe ser en formato dd-mm-yyyy
}
```

# 13. tipo_mantencion
### "/api/tipo_mantencion"
```
{
    "nombre": "tipo_mantencion 1"
}
```

# 14.1. register
### "/api/usuario/register"
Luego de registrar, revisar el correo para verificarlo.
```
{
    "username": "juanPerez",
    "correo": "test2@test.cl",
    "contrasena": "test123",
    "personal_id": 1
}
```

# 14.2. login
### "/api/usuario/login"
```
{
    "username": "juanPerez",
    "contrasena": "test123"
}
```

# 14.3. recuperar contraseña
### "/api/usuario/recover-password"
```
{
    "correo": "test2@test.cl"
}
```

# 14.4. reestablecer contraseña
### "/api/usuario/reset-password/:token"
```
{
    "contrasena": "newPassword1"
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
    "bitacora": {
        "compania_id": 2,
        "conductor_id": 1,
        "maquina_id": 1,
        "clave_id": 1,
        "direccion": "123 Calle Ejemplo",
        "f_salida": "04-11-2024",  
        "h_salida": "08:50",        
        "f_llegada": "10-11-2024",  
        "h_llegada": "10:50",       
        "km_salida": 50,
        "km_llegada": 75.0,
        "hmetro_salida": 30.0,
        "hmetro_llegada": 45.0,
        "hbomba_salida": 15.0,
        "hbomba_llegada": 20.1,
        "obs": "Observaciones opcionales"
    },
    "litros": 50.00,
    "valor_mon": 1000
}
```

# 20.1. stats (maintenance)
### "/api/stats/maintenance"
- Descripción: Obtiene datos de mantenciones agrupados por mes y tipo de mantención.
Respuesta:
- Response:
```
[
  {
    "month": "Ene",
    "preventivo": 20,
    "correctivo": 10,
    "emergencia": 5
  },
  {
    "month": "Feb",
    "preventivo": 25,
    "correctivo": 8,
    "emergencia": 3
  },
  {
    "month": "Mar",
    "preventivo": 18,
    "correctivo": 12,
    "emergencia": 7
  }
]
```
 
# 20.2. stats (service)
### "/api/stats/service"
- Descripción: Obtiene datos de servicios agrupados por mes y tipo de servicio.
- Response:
```
[
  {
    "month": "Ene",
    "incendios": 15,
    "rescates": 8,
    "otros": 5
  },
  {
    "month": "Feb",
    "incendios": 12,
    "rescates": 10,
    "otros": 7
  },
  {
    "month": "Mar",
    "incendios": 18,
    "rescates": 6,
    "otros": 4
  }
]
```
 
# 20.3. stats (fuel)
### "/api/stats/fuel"
- Descripción: Obtiene datos de consumo de combustible agrupados por mes y tipo de combustible.
- Response:
```
[
  {
    "month": "Ene",
    "diesel": 1000,
    "gasolina": 500
  },
  {
    "month": "Feb",
    "diesel": 1200,
    "gasolina": 600
  },
  {
    "month": "Mar",
    "diesel": 900,
    "gasolina": 450
  }
]
```
 
# 20.4. stats (company)
### "/api/stats/company"
- Descripción: Obtiene datos de compañías con el número de servicios y personal por compañía.
- Response:
```
[
  {
    "name": "Compañía 1",
    "servicios": 50,
    "personal": 30
  },
  {
    "name": "Compañía 2",
    "servicios": 45,
    "personal": 28
  },
  {
    "name": "Compañía 3",
    "servicios": 55,
    "personal": 32
  }
]
```
 
# 20.5. stats (driver)
### "/api/stats/driver"
- Descripción: Obtiene datos de los conductores con información de servicios y horas trabajadas.
- Response:
```
[
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
  {
    "id": 3,
    "nombre": "Carlos Rodríguez",
    "compañia": "Compañía 3",
    "servicios": 22,
    "horas": 110
  },
]
```