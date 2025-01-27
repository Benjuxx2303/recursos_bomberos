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

describe("Tipo Clave Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  describe("GET /api/tipo_clave", () => {
    it("debe devolver una lista de tipos de clave con paginación", async () => {
      const mockData = [
        { id: 1, nombre: "Clave1" },
        { id: 2, nombre: "Clave2" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/tipo_clave?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/tipo_clave")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  describe("GET /api/tipo_clave/:id", () => {
    it("debe devolver un tipo de clave por ID", async () => {
      const mockTipoClave = { id: 1, nombre: "Clave1" };

      mockQueryResponse([[mockTipoClave]]);

      const response = await request(app)
        .get("/api/tipo_clave/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTipoClave);
    });

    it("debe devolver 404 si el tipo de clave no se encuentra", async () => {
      mockQueryResponse([[]]);

      const response = await request(app)
        .get("/api/tipo_clave/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tipo de clave no encontrado");
    });
  });

  describe("POST /api/tipo_clave", () => {
    it("debe crear un nuevo tipo de clave", async () => {
      const newTipoClave = { nombre: "NuevaClave" };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/tipo_clave")
        .set("Authorization", `Bearer ${token}`)
        .send(newTipoClave);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newTipoClave.nombre);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidTipoClave = { nombre: "" };

      const response = await request(app)
        .post("/api/tipo_clave")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidTipoClave);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        "Tipo de datos inválido para 'nombre'",
      ]);
    });
  });

  describe("DELETE /api/tipo_clave/:id", () => {
    it("debe eliminar un tipo de clave", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/tipo_clave/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver 404 si el tipo de clave no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/tipo_clave/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tipo de clave no encontrado");
    });
  });

  describe("PATCH /api/tipo_clave/:id", () => {
    it("debe actualizar un tipo de clave", async () => {
      const updatedTipoClave = { nombre: "ClaveActualizada" };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, ...updatedTipoClave }]]);

      const response = await request(app)
        .patch("/api/tipo_clave/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedTipoClave);

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedTipoClave.nombre);
    });

    it("debe devolver 404 si el tipo de clave no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/tipo_clave/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: "Clave inexistente" });

      expect(response.status).toBe(404);
      expect(response.body.errors).toEqual([
        "Tipo de clave no encontrado",
      ]);
    });
  });
});
