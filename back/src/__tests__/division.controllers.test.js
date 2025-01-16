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

describe("Division Controller", () => {
  // Función reutilizable para manejar las respuestas de las consultas
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener divisiones con paginación
  describe("GET /api/division", () => {
    it("debe devolver la lista de divisiones con paginación", async () => {
      const mockData = [
        { id: 1, nombre: "Division A" },
        { id: 2, nombre: "Division B" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/division?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/division")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener una división por ID
  describe("GET /api/division/:id", () => {
    it("debe devolver la división solicitada", async () => {
      const mockDivision = {
        id: 1,
        nombre: "Division A",
      };

      mockQueryResponse([[mockDivision]]);

      const response = await request(app)
        .get("/api/division/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDivision);
    });

    it("debe devolver 404 si la división no se encuentra", async () => {
      mockQueryResponse([[]]); // No se encuentra la división

      const response = await request(app)
        .get("/api/division/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("División no encontrada");
    });
  });

  // Test para crear una nueva división
  describe("POST /api/division", () => {
    it("debe crear una nueva división", async () => {
      const newDivision = {
        nombre: "Division Nueva",
      };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/division")
        .set("Authorization", `Bearer ${token}`)
        .send(newDivision);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newDivision.nombre);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidDivision = { nombre: "" }; // Datos inválidos

      const response = await request(app)
        .post("/api/division")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidDivision);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        "La longitud del nombre debe estar entre 3 y 45 caracteres",
      ]);
    });
  });

  // Test para eliminar una división
  describe("DELETE /api/division/:id", () => {
    it("debe eliminar la división correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/division/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si la división no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/division/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("División no encontrada");
    });
  });

  // Test para actualizar una división
  describe("PATCH /api/division/:id", () => {
    it("debe actualizar la división correctamente", async () => {
      const updatedDivision = {
        nombre: "Division Actualizada",
      };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, nombre: updatedDivision.nombre }]]); // Simulamos la obtención de la división actualizada

      const response = await request(app)
        .patch("/api/division/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedDivision);

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedDivision.nombre);
    });

    it("debe devolver un error 404 si la división no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/division/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: "Division No Existe" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("División no encontrada");
    });
  });
});