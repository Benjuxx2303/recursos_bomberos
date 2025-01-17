import request from "supertest";
import app from "../app"; // Asegúrate de importar tu aplicación Express
import { pool } from "../db.js";
import { TOKEN_TEST } from "../config.js";

jest.mock("../db.js", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const token = TOKEN_TEST; // Asigna el valor del token aquí

describe("Mantencion Controller", () => {
  // Función reutilizable para manejar las respuestas de las consultas
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener todas las mantenciones con búsqueda
  describe("GET /api/mantencion", () => {
    it("debe devolver la lista de mantenciones", async () => {
      const mockData = [
        {
          id: 1,
          "bitacora.id": 1,
          "bitacora.compania": "Compañía 1",
          "bitacora.conductor": "12345678-9",
          // Agrega otros campos según sea necesario
        },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/mantencion?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/mantencion")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener una mantención por ID
// Test para obtener una mantención por ID
describe("GET /api/mantencion/:id", () => {
  it("debe devolver la mantención solicitada", async () => {
    const mockMantencion = [{
      id: 1,
      "bitacora.id": 1,
      "bitacora.compania": "Compañía 1",
      "bitacora.conductor": "12345678-9",
      "bitacora.direccion": "Dirección de prueba",
      "bitacora.fh_salida": "01-01-2025 12:00",
      "bitacora.fh_llegada": "01-01-2025 14:00",
      "bitacora.km_salida": 100,
      "bitacora.km_llegada": 150,
      "bitacora.hmetro_salida": 5,
      "bitacora.hmetro_llegada": 6,
      "bitacora.hbomba_salida": 10,
      "bitacora.hbomba_llegada": 11,
      "bitacora.obs": "Observación de prueba",
      patente: "ABC123",
      fec_inicio: "01-01-2025",
      fec_termino: "02-01-2025",
      ord_trabajo: "ORD123",
      n_factura: "FACT123",
      cost_ser: 200,
      taller: "Taller de prueba",
      img_url: "http://example.com/img.jpg",
      estado_mantencion: "Pendiente",
      tipo_mantencion: "Preventiva",
      tipo_mantencion_id: 1
    }];
    
    // Mock de la respuesta de la consulta
    mockQueryResponse([mockMantencion]); // Devuelve el array con un objeto de la mantención

    const response = await request(app)
      .get("/api/mantencion/1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockMantencion);  // Verifica si la respuesta es igual a lo que esperas
  });

  it("debe devolver 404 si la mantención no se encuentra", async () => {
    // Mock para cuando no se encuentra la mantención
    mockQueryResponse([[]]); // Devuelve un array vacío para simular que no hay resultados

    const response = await request(app)
      .get("/api/mantencion/999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Mantención no encontrada");
  });
});

TODO://ARREGLAR CREAR NUEVA MANTENCION
  // Test para crear una nueva mantención
// Test para crear una nueva mantención
describe("POST /api/mantencion", () => {
  it("debe crear una nueva mantención", async () => {
    const newMantencion = {
      "bitacora.compania_id": 1,  // Asegúrate de que sea un número
      "bitacora.personal_id": 1,  // Asegúrate de que sea un número
      "bitacora.direccion": "Dirección 1",  // Asegúrate de que sea una cadena
      "bitacora.km_salida": 100,  // Asegúrate de que sea un número
      "bitacora.km_llegada": 150,  // Asegúrate de que sea un número
      "bitacora.hmetro_salida": 5,  // Asegúrate de que sea un número
      "bitacora.hmetro_llegada": 6,  // Asegúrate de que sea un número
      "bitacora.hbomba_salida": 10,  // Asegúrate de que sea un número
      "bitacora.hbomba_llegada": 11,  // Asegúrate de que sea un número
      maquina_id: 1,  // Asegúrate de que sea un número
      taller_id: 1,  // Asegúrate de que sea un número
      estado_mantencion_id: 1,  // Asegúrate de que sea un número
      tipo_mantencion_id: 1,  // Asegúrate de que sea un número
      ord_trabajo: "ORD123",  // Asegúrate de que sea una cadena
      n_factura: "FACT123",  // Puede ser una cadena
      cost_ser: 200,  // Asegúrate de que sea un número
      fec_inicio: "01-01-2025",  // Fecha como cadena
      fec_termino: "02-01-2025"  // Fecha como cadena
    };

    mockQueryResponse([{ insertId: 1 }]);  // Simula la respuesta de la base de datos

    const response = await request(app)
      .post("/api/mantencion")
      .set("Authorization", `Bearer ${token}`)
      .send(newMantencion);

    console.log(response.body);  // Verifica los detalles del error

    expect(response.status).toBe(201);
    expect(response.body.mantencion_id).toBe(1);  // Verifica que se haya creado con el ID 1
  });


  it("debe devolver un error 400 si los datos son inválidos", async () => {
    const invalidMantencion = { "bitacora.compania_id": "", "bitacora.personal_id": ""}; // Datos inválidos

    const response = await request(app)
      .post("/api/mantencion")
      .set("Authorization", `Bearer ${token}`)
      .send(invalidMantencion);

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      'El campo "compania_id" no puede estar vacío',
      'El campo "personal_id" no puede estar vacío',
    ]);
  });
});


  // Test para eliminar una mantención
  describe("DELETE /api/mantencion/:id", () => {
    it("debe eliminar la mantención correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/mantencion/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si la mantención no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/mantencion/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Mantención no encontrada");
    });
  });

  // Test para actualizar una mantención
  describe("PATCH /api/mantencion/:id", () => {
    it("debe actualizar la mantención correctamente", async () => {
      const updatedMantencion = {
        "bitacora.direccion": "Nueva Dirección",
        // Agrega otros campos según sea necesario
      };

      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .patch("/api/mantencion/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedMantencion);

      expect(response.status).toBe(200);
    });

    it("debe devolver un error 404 si la mantención no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]); // Simulamos que la mantención no se encuentra

      const response = await request(app)
        .patch("/api/mantencion/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ "bitacora.direccion": "Dirección Cualquiera" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Mantención no encontrada");
    });
  });
});