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

describe("Conductor Maquina Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  describe("GET /api/conductor_maquina", () => {
    it("debe devolver una lista de conductores de máquina con paginación", async () => {
      const mockData = [
        { id: 1, personal_id: 1, maquina_id: 1 },
        { id: 2, personal_id: 2, maquina_id: 2 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/conductor_maquina?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/conductor_maquina")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  describe("GET /api/conductor_maquina/:id", () => {
    it("debe devolver un conductor de máquina por ID", async () => {
      const mockConductorMaquina = { id: 1, personal_id: 1, maquina_id: 1 };

      mockQueryResponse([[mockConductorMaquina]]);

      const response = await request(app)
        .get("/api/conductor_maquina/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockConductorMaquina);
    });

    it("debe devolver 404 si el conductor de máquina no se encuentra", async () => {
      mockQueryResponse([[]]);

      const response = await request(app)
        .get("/api/conductor_maquina/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("conductor_maquina no encontrado");
    });
  });

  describe("POST /api/conductor_maquina", () => {
    it("debe crear un nuevo conductor de máquina", async () => {
      const newConductorMaquina = { personal_id: 1, maquina_id: 1 };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/conductor_maquina")
        .set("Authorization", `Bearer ${token}`)
        .send(newConductorMaquina);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.personal_id).toBe(newConductorMaquina.personal_id);
      expect(response.body.maquina_id).toBe(newConductorMaquina.maquina_id);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidConductorMaquina = { personal_id: "abc", maquina_id: 1 };

      const response = await request(app)
        .post("/api/conductor_maquina")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidConductorMaquina);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('Tipo de datos inválido');
    });
  });

  describe("DELETE /api/conductor_maquina/:id", () => {
    it("debe eliminar un conductor de máquina", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/conductor_maquina/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver 404 si el conductor de máquina no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/conductor_maquina/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("conductor_maquina no encontrado");
    });
  });

  describe("PATCH /api/conductor_maquina/:id", () => {
    it("debe actualizar un conductor de máquina", async () => {
      const updatedConductorMaquina = { personal_id: 1, maquina_id: 2 };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, ...updatedConductorMaquina }]]);

      const response = await request(app)
        .patch("/api/conductor_maquina/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedConductorMaquina);

      expect(response.status).toBe(200);
      expect(response.body.maquina_id).toBe(updatedConductorMaquina.maquina_id);
    });

    it("debe devolver 400 si los datos son inválidos", async () => {
      const invalidConductorMaquina = { personal_id: "abc" };

      const response = await request(app)
        .patch("/api/conductor_maquina/1")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidConductorMaquina);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("Tipo de dato inválido para 'personal_id'");
    });
  });
});