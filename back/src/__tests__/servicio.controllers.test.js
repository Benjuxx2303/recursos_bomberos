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

describe("Servicio Controller", () => {
  // Función reutilizable para manejar las respuestas de las consultas
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener servicios con paginación
  describe("GET /api/servicio", () => {
    it("debe devolver la lista de servicios con paginación", async () => {
      const mockData = [
        { id: 1, descripcion: "Servicio A", subdivision: "Subdivision A" },
        { id: 2, descripcion: "Servicio B", subdivision: "Subdivision B" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/servicio?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/servicio")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener un servicio por ID
  describe("GET /api/servicio/:id", () => {
    it("debe devolver el servicio solicitado", async () => {
      const mockServicio = {
        id: 1,
        descripcion: "Servicio A",
        subdivision: "Subdivision A",
      };

      mockQueryResponse([[mockServicio]]);

      const response = await request(app)
        .get("/api/servicio/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockServicio);
    });

    it("debe devolver 404 si el servicio no se encuentra", async () => {
      mockQueryResponse([[]]); // No se encuentra el servicio

      const response = await request(app)
        .get("/api/servicio/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Servicio no encontrado");
    });
  });

  // Test para crear un nuevo servicio
  describe("POST /api/servicio", () => {
    it("debe crear un nuevo servicio", async () => {
      const newServicio = {
        subdivision_id: 1,
        descripcion: "Nuevo Servicio",
      };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/servicio")
        .set("Authorization", `Bearer ${token}`)
        .send(newServicio);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.descripcion).toBe(newServicio.descripcion);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidServicio = { subdivision_id: 1, descripcion: "" }; // Datos inválidos

      const response = await request(app)
        .post("/api/servicio")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidServicio);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        "La descripción no puede estar vacía",
      ]);
    });
  });

  // Test para eliminar un servicio
  describe("DELETE /api/servicio/:id", () => {
    it("debe eliminar el servicio correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/servicio/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si el servicio no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/servicio/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Servicio no encontrado");
    });
  });

  // Test para actualizar un servicio
  describe("PATCH /api/servicio/:id", () => {
    it("debe actualizar el servicio correctamente", async () => {
      const updatedServicio = {
        descripcion: "Servicio Actualizado",
      };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, descripcion: updatedServicio.descripcion }]]); // Simulamos la obtención del servicio actualizado

      const response = await request(app)
        .patch("/api/servicio/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedServicio);

      expect(response.status).toBe(200);
      expect(response.body.descripcion).toBe(updatedServicio.descripcion);
    });

    it("debe devolver un error 404 si el servicio no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/servicio/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ descripcion: "Servicio No Existe" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Servicio no encontrado");
    });
  });
});