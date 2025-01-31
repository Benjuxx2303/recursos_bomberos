import request from "supertest";
import { app } from "../app";
import { pool } from "../db.js";
import { TOKEN_TEST } from "../config.js";

jest.mock("../db.js", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const token = TOKEN_TEST; // Asigna el valor del token aquí

describe("Stats Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener datos de mantenimiento
  describe("GET /api/stats/maintenance", () => {
    it("debe devolver los datos de mantenimiento", async () => {
      const mockData = [
        { mes: 1, tipo_mantencion: "tipo1", total: 5 },
        { mes: 2, tipo_mantencion: "tipo2", total: 3 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/stats/maintenance")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/stats/maintenance")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de mantención");
    });
  });

  // Test para obtener datos de servicio
  describe("GET /api/stats/service", () => {
    it("debe devolver los datos de servicio con claves", async () => {
      const mockData = [
        { mes: 1, tipo_clave: "tipo1", total: 5 },
        { mes: 2, tipo_clave: "tipo2", total: 3 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/stats/service?startDate=2023-01-01&endDate=2023-01-31")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/stats/service")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de servicios");
    });
  });

  // Test para obtener datos de combustible
  describe("GET /api/stats/fuel", () => {
    it("debe devolver los datos de combustible", async () => {
      const mockData = [
        { mes: 1, compania: "Compania1", total_litros: 100, total_servicios: 5, promedio_litros_servicio: 20 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/stats/fuel?startDate=2023-01-01&endDate=2023-01-31")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/stats/fuel")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de combustible");
    });
  });

  // Test para obtener datos de compañías
  describe("GET /api/stats/company", () => {
    it("debe devolver los datos de compañías", async () => {
      const mockData = [
        { 
          compania: "Compania1", 
          total_servicios: 10, 
          total_maquinas: 5, 
          total_personal: 3, 
          promedio_minutos_servicio: 30 
        },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/stats/company")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/stats/company")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de compañías");
    });
  });

  // Test para obtener datos de conductores
  describe("GET /api/stats/driver", () => {
    it("debe devolver los datos de conductores", async () => {
      const mockData = [
        { conductor: "Conductor1", compania: "Compania1", total_servicios: 10, maquinas_conducidas: 3, promedio_minutos_servicio: 25 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/stats/driver")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/stats/driver")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de conductores");
    });
  });

  // Test para obtener datos de resumen
  describe("GET /api/stats/summary", () => {
    it("debe devolver los datos de resumen", async () => {
      const mockSummaryData = {
        pendingMaintenance: 5,
        servicesThisMonth: 10,
        fuelConsumption: 200,
        totalCompanies: 3,
        activeDrivers: 8
      };
    
      // Simulamos las respuestas para cada consulta basándonos en el SQL real
      pool.query.mockImplementation((query) => {
        if (query.includes('estado_mantencion')) {
          return Promise.resolve([[{ total: 5 }]]);
        } else if (query.includes('MONTH(b.fh_salida)') && !query.includes('carga_combustible')) {
          return Promise.resolve([[{ total: 10 }]]);
        } else if (query.includes('carga_combustible')) {
          return Promise.resolve([[{ total: 200 }]]);
        } else if (query.includes('FROM compania')) {
          return Promise.resolve([[{ total: 3 }]]);
        } else if (query.includes('DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)')) {
          return Promise.resolve([[{ total: 8 }]]);
        }
        return Promise.resolve([[{ total: 0 }]]);
      });
    
      const response = await request(app)
        .get("/api/stats/summary")
        .set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSummaryData);
    });
    
    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/stats/summary")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de resumen");
    });
  });
});