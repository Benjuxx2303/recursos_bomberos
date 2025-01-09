# Documentación de endpoints GET

A continuación se detallan los endpoints GET de **claves**, **compañías**, **máquinas** y **personal**, incluyendo la estructura de las respuestas y el uso de sus parámetros.

---

## Claves

### GET `/api/clave`

Obtiene una lista de claves.

**Parámetros de consulta opcionales:**

- 

page

: Número de página (por defecto, 1).
- 

pageSize

: Tamaño de página, es decir, número de registros por página (por defecto, 10).

Si no se proporciona el parámetro 

page

, se devolverán todas las claves sin paginación.

**Respuesta:**

```json
[
  {
    "id": 1,
    "codigo": "0001",
    "descripcion": "Clave de ejemplo",
    "isDeleted": 0
  },
  {
    "id": 2,
    "codigo": "0002",
    "descripcion": "Otra clave",
    "isDeleted": 0
  },
  ...
]
```

### GET `/api/clave/:id`

Obtiene una clave específica por su ID.

**Parámetros de ruta:**

- 

id

: ID de la clave.

**Respuesta:**

```json
{
  "id": 1,
  "codigo": "0001",
  "descripcion": "Clave de ejemplo",
  "isDeleted": 0
}
```

---

## Compañías

### GET `/api/compania`

Obtiene una lista de compañías.

**Parámetros de consulta opcionales:**

- 

page

: Número de página (por defecto, 1).
- 

pageSize

: Tamaño de página (por defecto, 10).

Si no se proporciona el parámetro 

page

, se devolverán todas las compañías sin paginación.

**Respuesta:**

```json
[
  {
    "id": 1,
    "nombre": "Compañía 1",
    "isDeleted": 0
  },
  {
    "id": 2,
    "nombre": "Compañía 2",
    "isDeleted": 0
  },
  ...
]
```

### GET `/api/compania/:id`

Obtiene una compañía específica por su ID.

**Parámetros de ruta:**

- 

id

: ID de la compañía.

**Respuesta:**

```json
{
  "id": 1,
  "nombre": "Compañía 1",
  "isDeleted": 0
}
```

---

## Máquinas

### GET `/api/maquina`

Obtiene una lista de máquinas con detalles.

**Parámetros de consulta opcionales:**

- 

page

: Número de página (por defecto, 1).
- 

pageSize

: Tamaño de página (por defecto, 10).

Si no se proporciona el parámetro 

page

, se devolverán todas las máquinas sin paginación.

**Respuesta:**

```json
[
  {
    "maquina_id": 1,
    "disponible": 1,
    "codigo": "MAQ-001",
    "patente": "ABC123",
    "num_chasis": "CHS12345",
    "vin": "1HGCM82633A004352",
    "bomba": 1,
    "hmetro_bomba": 1200.5,
    "hmetro_motor": 2500.0,
    "kmetraje": 15000,
    "num_motor": "MT12345",
    "ven_patente": "23-05-2026",
    "cost_rev_tec": 80000,
    "ven_rev_tec": "05-10-2025",
    "cost_seg_auto": 120000,
    "ven_seg_auto": "12-01-2026",
    "tipo_maquina": "Camión",
    "compania_id": 1,
    "compania": "Compañía 1",
    "procedencia": "Nacional",
    "img_url": "https://ejemplo.com/imagen.jpg"
  },
  ...
]
```

### GET `/api/maquina/:id`

Obtiene detalles de una máquina específica por su ID.

**Parámetros de ruta:**

- 

id

: ID de la máquina.

**Respuesta:**

```json
{
  "maquina_id": 1,
  "disponible": 1,
  "codigo": "MAQ-001",
  "patente": "ABC123",
  "num_chasis": "CHS12345",
  "vin": "1HGCM82633A004352",
  "bomba": 1,
  "hmetro_bomba": 1200.5,
  "hmetro_motor": 2500.0,
  "kmetraje": 15000,
  "num_motor": "MT12345",
  "ven_patente": "23-05-2026",
  "cost_rev_tec": 80000,
  "ven_rev_tec": "05-10-2025",
  "cost_seg_auto": 120000,
  "ven_seg_auto": "12-01-2026",
  "tipo_maquina": "Camión",
  "compania_id": 1,
  "compania": "Compañía 1",
  "procedencia": "Nacional",
  "img_url": "https://ejemplo.com/imagen.jpg"
}
```

---

## Personal

### GET `/api/personal`

Obtiene una lista de personal con detalles.

**Parámetros de consulta opcionales:**

- 

page

: Número de página (por defecto, 1).
- 

pageSize

: Tamaño de página (por defecto, 10).
- 

compania_id

: Filtra por ID de compañía.
- 

maquina_id

: Filtra por ID de máquina.
- 

rol_personal_id

: Filtra por ID de rol personal.
- 

nombre

: Filtra por nombre (búsqueda parcial).

Si no se proporciona el parámetro 

page

, se devolverán todos los registros sin paginación.

**Respuesta:**

```json
[
  {
    "id": 1,
    "rut": "12.345.678-9",
    "nombre": "Juan",
    "apellido": "Pérez",
    "fec_nac": "01-01-1990",
    "fec_ingreso": "15-03-2015",
    "img_url": "https://ejemplo.com/imagen.jpg",
    "obs": "Operador experimentado",
    "ven_licencia": "15-03-2025",
    "isDeleted": 0,
    "rol_personal": "Conductor",
    "compania": "Compañía 1",
    "compania_id": 1,
    "rol_personal_id": 2,
    "antiguedad": 96,
    "maquinas": [1, 3]
  },
  ...
]
```

### GET `/api/personal/:id`

Obtiene detalles de un personal específico por su ID.

**Parámetros de ruta:**

- 

id

: ID del personal.

**Respuesta:**

```json
{
  "id": 1,
  "rut": "12.345.678-9",
  "nombre": "Juan",
  "apellido": "Pérez",
  "fec_nac": "01-01-1990",
  "fec_ingreso": "15-03-2015",
  "img_url": "https://ejemplo.com/imagen.jpg",
  "obs": "Operador experimentado",
  "ven_licencia": "15-03-2025",
  "isDeleted": 0,
  "rol_personal": "Conductor",
  "compania": "Compañía 1",
  "compania_id": 1,
  "rol_personal_id": 2,
  "antiguedad": 96,
  "maquinas": [1, 3]
}
```

---

**Notas:**

- Los campos 

isDeleted

 indican si el registro está activo (`0`) o eliminado (`1`).
- En el caso de personal, el campo `antiguedad` representa la cantidad de meses desde la fecha de ingreso hasta la fecha actual.
- El campo 

maquinas

 es un arreglo de IDs de las máquinas asignadas al personal.

---

Estos endpoints están implementados en los siguientes archivos:

- Claves: 

clave.controllers.js


- Compañías: 

compania.controllers.js


- Máquinas: 

maquina.controllers.js


- Personal: 

personal.controllers.js