import request from "supertest";
import app from "../app"; // Asegúrate de importar tu aplicación Express
import { pool } from "../db.js";
import { TOKEN_TEST } from "../config.js";

jest.mock("../db.js", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const token = TOKEN_TEST;

describe("Tipo Mantencion Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener tipos de mantención con paginación
  describe("GET /api/tipo_mantencion", () => {
    it("debe devolver la lista de tipos de mantención con paginación", async () => {
      const mockData = [
        { id: 1, nombre: "Mantención A" },
        { id: 2, nombre: "Mantención B" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/tipo_mantencion?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/tipo_mantencion")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener un tipo de mantención por ID
  describe("GET /api/tipo_mantencion/:id", () => {
    it("debe devolver el tipo de mantención solicitado", async () => {
      const mockTipoMantencion = {
        id: 1,
        nombre: "Mantención A",
      };

      mockQueryResponse([[mockTipoMantencion]]);

      const response = await request(app)
        .get("/api/tipo_mantencion/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTipoMantencion);
    });

    it("debe devolver 404 si el tipo de mantención no se encuentra", async () => {
      mockQueryResponse([[]]); // No se encuentra el tipo de mantención

      const response = await request(app)
        .get("/api/tipo_mantencion/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tipo de mantención no encontrada");
    });
  });

  // Test para crear un nuevo tipo de mantención
  describe("POST /api/tipo_mantencion", () => {
    it("debe crear un nuevo tipo de mantención", async () => {
      const newTipoMantencion = {
        nombre: "Mantención C",
      };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/tipo_mantencion")
        .set("Authorization", `Bearer ${token}`)
        .send(newTipoMantencion);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newTipoMantencion.nombre);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidTipoMantencion = { nombre: "" }; // Datos inválidos

      const response = await request(app)
        .post("/api/tipo_mantencion")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidTipoMantencion);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("Tipo de datos inválido para 'nombre'");
    });
  });

  // Test para eliminar un tipo de mantención
  describe("DELETE /api/tipo_mantencion/:id", () => {
    it("debe eliminar el tipo de mantención correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/tipo_mantencion/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si el tipo de mantención no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/tipo_mantencion/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tipo de mantención no encontrada");
    });
  });

  // Test para actualizar un tipo de mantención
  describe("PATCH /api/tipo_mantencion/:id", () => {
    it("debe actualizar el tipo de mantención correctamente", async () => {
      const updatedTipoMantencion = {
        nombre: "Mantención Actualizada",
        isDeleted: 0 
      };

      // Mock para verificar existencia
      mockQueryResponse([[{ id: 1, nombre: "Nombre Original" }]]);
      // Mock para verificar duplicados
      mockQueryResponse([[{ count: 0 }]]);
      // Mock para la actualización
      mockQueryResponse([{ affectedRows: 1 }]);
      // Mock para obtener el registro actualizado
      mockQueryResponse([[{ 
        id: 1, 
        nombre: updatedTipoMantencion.nombre,
        isDeleted: updatedTipoMantencion.isDeleted 
      }]]);

      const response = await request(app)
        .patch("/api/tipo_mantencion/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedTipoMantencion);

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedTipoMantencion.nombre);
      expect(response.body.isDeleted).toBe(updatedTipoMantencion.isDeleted);
    });

    it("debe devolver un error 404 si el tipo de mantención no existe", async () => {
      mockQueryResponse([[]]); // No se encuentra el tipo de mantención

      const response = await request(app)
        .patch("/api/tipo_mantencion/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: "Mantención No Existe" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tipo de mantención no encontrada");
    });
  });
});