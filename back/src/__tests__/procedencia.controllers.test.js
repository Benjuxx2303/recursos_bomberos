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

describe("Procedencia Controller", () => {
  const mockQueryResponse = (response) =>
    pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  describe("GET /api/procedencia", () => {
    it("debe devolver una lista de procedencias con paginación", async () => {
      const mockData = [
        { id: 1, nombre: "Procedencia1" },
        { id: 2, nombre: "Procedencia2" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/procedencia?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/procedencia")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  describe("GET /api/procedencia/:id", () => {
    it("debe devolver una procedencia por ID", async () => {
      const mockProcedencia = { id: 1, nombre: "Procedencia1" };

      mockQueryResponse([[mockProcedencia]]);

      const response = await request(app)
        .get("/api/procedencia/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProcedencia);
    });

    it("debe devolver 404 si la procedencia no se encuentra", async () => {
      mockQueryResponse([[]]);

      const response = await request(app)
        .get("/api/procedencia/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Procedencia no encontrada");
    });
  });

  describe("POST /api/procedencia", () => {
    it("debe crear una nueva procedencia", async () => {
      const newProcedencia = { nombre: "NuevaProcedencia" };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/procedencia")
        .set("Authorization", `Bearer ${token}`)
        .send(newProcedencia);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newProcedencia.nombre);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidProcedencia = { nombre: "" };

      const response = await request(app)
        .post("/api/procedencia")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidProcedencia);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain(
        "Nombre es un campo obligatorio y debe ser una cadena válida"
      );
    });
  });

  describe("DELETE /api/procedencia/:id", () => {
    it("debe eliminar una procedencia", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/procedencia/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver 404 si la procedencia no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/procedencia/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Procedencia no encontrada");
    });
  });

  describe("PATCH /api/procedencia/:id", () => {
    it("debe actualizar una procedencia", async () => {
      const updatedProcedencia = { nombre: "Procedencia" };

      // Simula las respuestas de las consultas
      mockQueryResponse([[]]); // Simula que no hay ninguna procedencia con el mismo nombre
      mockQueryResponse([{ affectedRows: 1 }]); // Simula que la actualización fue exitosa
      mockQueryResponse([[{ id: 1, nombre: updatedProcedencia.nombre }]]); // Simula que la procedencia se actualizó correctamente

      // Realiza la solicitud PATCH para actualizar la procedencia
      const response = await request(app)
        .patch("/api/procedencia/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedProcedencia);

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedProcedencia.nombre);
    });

    it("debe devolver 400 si los datos son inválidos", async () => {
      const invalidProcedencia = { nombre: "NombreMuyLargoQueExcedeElLimite" }; // Ajusta según tu lógica de validación

      const response = await request(app)
        .patch("/api/procedencia/1")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidProcedencia);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain(
        "Nombre no puede tener más de 30 caracteres"
      );
    });
  });
});
