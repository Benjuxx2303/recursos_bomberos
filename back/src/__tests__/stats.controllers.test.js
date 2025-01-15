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

describe("Stats Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  describe("GET /stats/maintenance", () => {
    it("debe devolver los datos de mantenimiento", async () => {
      const mockData = [
        { mes: "Ene", tipo_mantencion: "Tipo1", total: 5 },
        { mes: "Feb", tipo_mantencion: "Tipo2", total: 3 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/stats/maintenance")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/stats/maintenance")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de mantención");
    });
  });

  describe("GET /stats/service", () => {
    it("debe devolver los datos de servicio con claves", async () => {
      const mockData = [
        { mes: "Ene", tipo_clave: "Clave1", total: 10 },
        { mes: "Feb", tipo_clave: "Clave2", total: 7 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/stats/service")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/stats/service")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de servicios");
    });
  });

  describe("GET /stats/fuel", () => {
    it("debe devolver los datos de combustible", async () => {
      const mockData = [
        { mes: "Ene", compania: "Compania1", total_litros: 100 },
        { mes: "Feb", compania: "Compania2", total_litros: 200 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/stats/fuel")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/stats/fuel")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de combustible");
    });
  });

  describe("GET /stats/company", () => {
    it("debe devolver los datos de la compañía", async () => {
      const mockData = [
        { compania: "Compania1", servicios: 10, maquinas: 5 },
        { compania: "Compania2", servicios: 20, maquinas: 8 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/stats/company")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/stats/company")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de compañías");
    });
  });

  describe("GET /stats/driver", () => {
    it("debe devolver los datos de los conductores", async () => {
      const mockData = [
        { conductor: "Conductor1", total_servicios: 5 },
        { conductor: "Conductor2", total_servicios: 10 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/stats/driver")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/stats/driver")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de conductores");
    });
  });

  describe("GET /stats/summary", () => {
    it("debe devolver los datos de resumen", async () => {
      const mockData = {
        pendingMaintenance: 5,
        servicesThisMonth: 20,
        fuelConsumption: 1000,
        totalCompanies: 10,
        activeDrivers: 8,
      };

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/stats/summary")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/stats/summary")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener los datos de resumen");
    });
  });
});