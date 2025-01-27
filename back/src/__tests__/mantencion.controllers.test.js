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
          'bitacora.id': 1,
          'bitacora.compania': "Compañía 1",
          'bitacora.conductor': "12345678-9",
          'bitacora.direccion': "Dirección de prueba",
          'bitacora.fh_salida': "01-01-2025 12:00",
          'bitacora.fh_llegada': "01-01-2025 14:00",
          'bitacora.km_salida': 100,
          'bitacora.km_llegada': 150,
          'bitacora.hmetro_salida': 5,
          'bitacora.hmetro_llegada': 6,
          'bitacora.hbomba_salida': 10,
          'bitacora.hbomba_llegada': 11,
          'bitacora.obs': "Observación de prueba",
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
        }
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
        "bitacora.direccion": "Dirección de destino",
        "bitacora.f_salida": "01-01-2024",
        "bitacora.h_salida": "08:30",
        "bitacora.clave_id": 4,
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
        fec_inicio: "01-01-2024",
        fec_termino: "02-01-2024"
      };
    
      const mockResponses = [
        [[{ disponible: 1 }]],
        [[{ disponible: 1 }]],
        [[{ id: 1 }]],
        [[{ id: 1 }]],
        [[{ id: 1 }]],
        [[{ id: 1 }]],
        [[{ compania_id: 2 }]],
        [[{ id: 1 }]],
        [[{ id: 1 }]],
        [[{ id: 1 }]],
        [[{ insertId: 1 }]],
        [[{ affectedRows: 1 }]],
        [[{ affectedRows: 1 }]],
        [[{ insertId: 1 }]]
      ];
    
      jest.spyOn(pool, "query").mockImplementation(() => {
        const response = mockResponses.shift();
        return Promise.resolve(response || [[{ insertId: 1 }]]);
      });
    
      const response = await request(app)
        .post("/api/mantencion")
        .set("Authorization", `Bearer ${token}`)
        .send(newMantencion);
    
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: "Mantención creada exitosamente"
      });
    });
    
    
    
    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidMantencion = {
        "bitacora.compania_id": null,
        "bitacora.personal_id": null,
        "bitacora.direccion": 123,
        maquina_id: "no-numerico",
        "bitacora.clave_id": "no-numerico"
      };
    
      const response = await request(app)
        .post("/api/mantencion")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidMantencion);
    
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: [
          "Tipo de datos inválido en la bitácora",
          "La máquina no está disponible para mantenimiento",
          "El personal no está disponible para la mantención",
          "km_salida es obligatorio",
          "km_llegada es obligatorio",
          "hmetro_salida es obligatorio",
          "hmetro_llegada es obligatorio",
          "hbomba_salida es obligatorio",
          "hbomba_llegada es obligatorio"
        ]
      });
    });
    
    
    it("debe devolver error si la máquina no está disponible", async () => {
      const newMantencion = {
        "bitacora.compania_id": 2,
        "bitacora.personal_id": 29,
        "bitacora.direccion": "Dirección de destino",
        "bitacora.clave_id": 4,
        "bitacora.km_salida": 1500,
        "bitacora.km_llegada": 1600,
        "bitacora.hmetro_salida": 120.5,
        "bitacora.hmetro_llegada": 130.7,
        "bitacora.hbomba_salida": 50,
        "bitacora.hbomba_llegada": 55.8,
        maquina_id: 8
      };
    
      jest.spyOn(pool, 'query').mockImplementation(() => {
        return [[{ disponible: 0 }]]; // Máquina no disponible
      });
    
      const response = await request(app)
        .post("/api/mantencion")
        .set("Authorization", `Bearer ${token}`)
        .send(newMantencion);
    
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: [
          "La máquina no está disponible para mantenimiento",
          "El personal no está disponible para la mantención",
        ]
      });
    });
    

    it("debe devolver error si las fechas son inválidas", async () => {
      const newMantencion = {
        "bitacora.compania_id": 2,
        "bitacora.personal_id": 29,
        "bitacora.direccion": "Dirección de destino",
        "bitacora.f_salida": "2024/01/01",
        "bitacora.h_salida": "25:00",
        "bitacora.clave_id": 4,
        "bitacora.km_salida": 1500,
        "bitacora.km_llegada": 1600,
        "bitacora.hmetro_salida": 120.5,
        "bitacora.hmetro_llegada": 130.7,
        "bitacora.hbomba_salida": 50,
        "bitacora.hbomba_llegada": 55.8,
        maquina_id: 8,
        fec_inicio: "2024/01/01",
        fec_termino: "invalid-date"
      };

      jest.spyOn(pool, 'query').mockImplementation(() => {
        return [[{ disponible: 1 }]];
      });

      const response = await request(app)
        .post("/api/mantencion")
        .set("Authorization", `Bearer ${token}`)
        .send(newMantencion);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain(
        "El formato de la fecha o la hora de salida es inválido. Deben ser dd-mm-aaaa y HH:mm"
      );
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
