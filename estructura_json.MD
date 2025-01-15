
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
    "nombre": "TEST",
    "descripcion": ""
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
  "modelo_id": 123,
  "codigo": "ABC123",
  "patente": "XYZ-1234",
  "num_chasis": "1234567890",
  "vin": "1HGBH41JXMN109186",
  "bomba": "Bomba A1",
  "hmetro_bomba": 1500.75,
  "hmetro_motor": 2500.50,
  "kmetraje": 10000,
  "num_motor": "M123456",
  "ven_patente": "15-03-2025",
  "procedencia_id": 2,
  "cost_rev_tec": 1500.25,
  "ven_rev_tec": "15-06-2025",
  "cost_seg_auto": 200.50,
  "ven_seg_auto": "15-06-2025",
  "peso_kg": 5000,
  "nombre": "Máquina Excavadora"
}

```

# 9. taller
### "/api/taller"
```
{
  "tipo": "Test",
  "razon_social": "Test",
  "rut": "77.777.777-7",
  "telefono": "98756478",
  "contacto": "Test",
  "tel_contacto": "",
  "direccion": "",
  "correo": "ashdjkahs@gmail.com"
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
    "personal_id": 29,
    "compania_id": 16,
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
# 12. tipo_mantencion
### "/api/tipo_mantencion"
```
{
    "nombre": "tipo_mantencion 1"
}
```

# 13. mantencion
### "/api/mantencion"
```
{
    "bitacora.compania_id": 2,
    "bitacora.personal_id": 29,
    "bitacora.clave_id": 4,
    "bitacora.direccion": "Dirección de destino",
    "bitacora.f_salida": "01-01-2024",
    "bitacora.h_salida": "08:30",
    "bitacora.f_llegada": "01-01-2024",
    "bitacora.h_llegada": "12:45",
    "bitacora.km_salida": 1500,
    "bitacora.km_llegada": 1600,
    "bitacora.hmetro_salida": 120.5,
    "bitacora.hmetro_llegada": 130.7,
    "bitacora.hbomba_salida": 50,
    "bitacora.hbomba_llegada": 55.8,
    "bitacora.obs": "Observaciones adicionales si hay alguna",
    "maquina_id": 8,
    "taller_id": 4,
    "estado_mantencion_id": 1,
    "tipo_mantencion_id": 1,
    "ord_trabajo": "OT12345",
    "n_factura": 45678,
    "cost_ser": 50000,
    "fec_inicio": "01-01-2024", // Esta fecha es opcional y debe ser en formato dd-mm-yyyy
    "fec_termino": "02-01-2024" // Esta fecha es opcional y debe ser en formato dd-mm-yyyy
}
```

# 13.1 mantencion (legacy) POST
### "/api/mantencion/old"
```
{
    "bitacora_id": 85,
    "maquina_id": 8,
    "taller_id": 4,
    "estado_mantencion_id": 13,
    "tipo_mantencion_id": 1,
    "fec_inicio": "01-01-2024",  // Esta fecha es opcional y debe ser en formato dd-mm-yyyy
    "fec_termino": "02-01-2024",  // Esta fecha es opcional y debe ser en formato dd-mm-yyyy
    "ord_trabajo": "OT12345",
    "n_factura": 45678,
    "cost_ser": 50000
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
  "bitacora.compania_id": 1,
  "bitacora.personal_id": 29,
  "bitacora.maquina_id": 8,
  "bitacora.clave_id": 4,
  "bitacora.direccion": "Dirección de prueba",
  "bitacora.f_salida": "11-12-2024",
  "bitacora.h_salida": "08:00",
  "bitacora.f_llegada": "11-12-2024",
  "bitacora.h_llegada": "10:00",
  "bitacora.km_salida": 1000.5,
  "bitacora.km_llegada": 1050.5,
  "bitacora.hmetro_salida": 150.2,
  "bitacora.hmetro_llegada": 155.2,
  "bitacora.hbomba_salida": 200.1,
  "bitacora.hbomba_llegada": 210.1,
  "bitacora.obs": "Observaciones de la bitácora",
  "litros": 50,
  "valor_mon": 150.75
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
