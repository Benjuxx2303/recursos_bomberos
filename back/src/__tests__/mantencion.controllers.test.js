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
  const mockQueryResponse = (response) =>
    pool.query.mockResolvedValue(response);
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
      const mockMantencion = [
        {
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
          tipo_mantencion_id: 1,
        },
      ];

      // Mock de la respuesta de la consulta
      mockQueryResponse([mockMantencion]); // Devuelve el array con un objeto de la mantención

      const response = await request(app)
        .get("/api/mantencion/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMantencion); // Verifica si la respuesta es igual a lo que esperas
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

  // Test para crear una nueva mantención
  describe("POST /api/mantencion", () => {
    it("debe crear una nueva mantención", async () => {
      const newMantencion = {
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
        maquina_id: 8,
        taller_id: 4,
        estado_mantencion_id: 1,
        tipo_mantencion_id: 1,
        ord_trabajo: "OT12345",
        n_factura: 45678,
        cost_ser: 50000,
        fec_inicio: "01-01-2024", // Esta fecha es opcional y debe ser en formato dd-mm-yyyy
        fec_termino: "02-01-2024", // Esta fecha es opcional y debe ser en formato dd-mm-yyyy  // Fecha como cadena
      };

      mockQueryResponse([{ insertId: 1 }]); // Simula la respuesta de la base de datos

      const response = await request(app)
        .post("/api/mantencion")
        .set("Authorization", `Bearer ${token}`)
        .send(newMantencion);

      console.log(response.body); // Verifica los detalles del error

      expect(response.status).toBe(201);
      expect(response.body.mantencion_id).toBe(1); // Verifica que se haya creado con el ID 1
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidMantencion = {
        "bitacora.compania_id": "",
        "bitacora.personal_id": "",
      }; // Datos inválidos

      const response = await request(app)
        .post("/api/mantencion")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidMantencion);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        "Tipo de datos inválido en la bitácora",
        "km_salida es obligatorio",
        "km_llegada es obligatorio",
        "hmetro_salida es obligatorio",
        "hmetro_llegada es obligatorio",
        "hbomba_salida es obligatorio",
        "hbomba_llegada es obligatorio",
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
        maquina_id: 8,
        taller_id: 4,
        estado_mantencion_id: 1,
        tipo_mantencion_id: 1,
        ord_trabajo: "OT12345",
        n_factura: 45678,
        cost_ser: 50000,
        fec_inicio: "01-01-2024", // Esta fecha es opcional y debe ser en formato dd-mm-yyyy
        fec_termino: "02-01-2024", // Esta fecha es opcional y debe ser en formato dd-mm-yyyy
      };

      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .patch("/api/mantencion/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedMantencion);

      expect(response.status).toBe(200);
    });

    it("debe devolver un error 404 si la mantención no existe", async () => {
      const updatedMantencionDoesNotExist = {
        cost_ser: 50000,
      };
      mockQueryResponse([{ affectedRows: 0 }]); // Simulamos que la mantención no se encuentra

      const response = await request(app)
        .patch("/api/mantencion/999")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedMantencionDoesNotExist);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Mantención no encontrada");
    });
  });
});
