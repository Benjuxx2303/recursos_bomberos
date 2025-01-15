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

describe("Máquina Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener detalles de máquinas con paginación
  describe("GET /api/maquina", () => {
    it("debe devolver la lista de máquinas con paginación", async () => {
      const mockData = [{ id: 1, codigo: "M001", patente: "ABC123" }];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/maquina?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/maquina?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener una máquina por ID
  describe("GET /api/maquina/:id", () => {
    it("debe devolver la máquina solicitada", async () => {
      const mockMaquina = { id: 1, codigo: "M001", patente: "ABC123" };

      mockQueryResponse([[mockMaquina]]);

      const response = await request(app)
        .get("/api/maquina/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMaquina);
    });

    it("debe devolver 404 si la máquina no se encuentra", async () => {
      mockQueryResponse([[]]);

      const response = await request(app)
        .get("/api/maquina/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Máquina no encontrada");
    });
  });

  // Test para crear una máquina
  describe("POST /api/maquina", () => {
    it("debe crear una nueva máquina", async () => {
      const newMaquina = { codigo: "M001", patente: "ABC123" };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/maquina")
        .set("Authorization", `Bearer ${token}`)
        .send(newMaquina);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidMaquina = { codigo: "", patente: "" };

      const response = await request(app)
        .post("/api/maquina")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidMaquina);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  // Test para actualizar una máquina
  describe("PATCH /api/maquina/:id", () => {
    it("debe actualizar una máquina", async () => {
      const updatedMaquina = { codigo: "M002", patente: "XYZ789" };

      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .patch("/api/maquina/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedMaquina);

      expect(response.status).toBe(200);
    });

    it("debe devolver un error 404 si la máquina no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/maquina/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ codigo: "M003" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Máquina no encontrada");
    });
  });

  // Test para eliminar una máquina
  describe("DELETE /api/maquina/:id", () => {
    it("debe eliminar una máquina correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/maquina/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si la máquina no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/maquina/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Máquina no encontrada");
    });
  });
});
