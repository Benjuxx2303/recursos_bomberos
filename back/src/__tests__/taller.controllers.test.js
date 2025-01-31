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

describe("Taller Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  describe("GET /api/taller", () => {
    it("debe devolver una lista de talleres con paginación", async () => {
      const mockData = [
        { id: 1, tipo: "Taller1", razon_social: "Razón Social 1" },
        { id: 2, tipo: "Taller2", razon_social: "Razón Social 2" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/taller?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/taller")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  describe("GET /api/taller/:id", () => {
    it("debe devolver un taller por ID", async () => {
      const mockTaller = { id: 1, tipo: "Taller1", razon_social: "Razón Social 1" };

      mockQueryResponse([[mockTaller]]);

      const response = await request(app)
        .get("/api/taller/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTaller);
    });

    it("debe devolver 404 si el taller no se encuentra", async () => {
      mockQueryResponse([[]]);

      const response = await request(app)
        .get("/api/taller/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Taller no encontrado");
    });
  });

  describe("POST /api/taller", () => {
    it("debe crear un nuevo taller", async () => {
      const newTaller = {
        tipo: "NuevoTaller",
        razon_social: "Nueva Razón Social",
        rut: "10737848-0",
        telefono: "123456789",
        contacto: "Contacto",
        tel_contacto: "987654321",
        direccion: "Dirección",
        correo: "correo@example.com",
      };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/taller")
        .set("Authorization", `Bearer ${token}`)
        .send(newTaller);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.razon_social).toBe(newTaller.razon_social);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidTaller = { tipo: "MUCHOSCARACTERESAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", razon_social: "" };

      const response = await request(app)
        .post("/api/taller")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidTaller);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('El campo "tipo" no puede tener más de 50 caracteres');
    });
  });

  describe("DELETE /api/taller/:id", () => {
    it("debe eliminar un taller", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/taller/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver 404 si el taller no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/taller/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Taller no encontrado");
    });
  });

  describe("PATCH /api/taller/:id", () => {
    it("debe actualizar un taller", async () => {
      const updatedTaller = { 
        tipo: "TallerActualizado", 
        razon_social: "Razón Actualizada" 
      };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, ...updatedTaller }]]);

      const response = await request(app)
        .patch("/api/taller/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedTaller);

      expect(response.status).toBe(200);
      expect(response.body.razon_social).toBe(updatedTaller.razon_social);
    });

    it("debe devolver 400 si los datos son inválidos", async () => {
      const invalidTaller = { razon_social: "NombreMuyLargoQueExcedeElLimiteDeCaracteresQueEsPermitidoPorLaValidacion" };

      const response = await request(app)
        .patch("/api/taller/1")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidTaller);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('El campo "razon_social" no puede tener más de 45 caracteres');
    });
  });
});