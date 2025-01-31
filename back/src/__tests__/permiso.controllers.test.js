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

describe("Permiso Controller", () => {
  const mockQueryResponse = (response) =>
    pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  describe("GET /api/permiso", () => {
    it("debe devolver una lista de permisos", async () => {
      const mockData = [
        { id: 1, nombre: "Permiso1", descripcion: "Descripción 1" },
        { id: 2, nombre: "Permiso2", descripcion: "Descripción 2" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/permiso")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/permiso")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  describe("GET /api/permiso/:id", () => {
    it("debe devolver un permiso por ID", async () => {
      const mockPermiso = {
        id: 1,
        nombre: "Permiso1",
        descripcion: "Descripción 1",
      };

      mockQueryResponse([[mockPermiso]]);

      const response = await request(app)
        .get("/api/permiso/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPermiso);
    });

    it("debe devolver 404 si el permiso no se encuentra", async () => {
      mockQueryResponse([[]]);

      const response = await request(app)
        .get("/api/permiso/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Permiso no encontrado");
    });
  });

  describe("POST /api/permiso", () => {
    it("debe crear un nuevo permiso", async () => {
      const newPermiso = {
        nombre: "NuevoPermiso",
        descripcion: "Nueva descripción",
      };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/permiso")
        .set("Authorization", `Bearer ${token}`)
        .send(newPermiso);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newPermiso.nombre);
      expect(response.body.descripcion).toBe(newPermiso.descripcion);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidPermiso = { nombre: "", descripcion: "" };

      const response = await request(app)
        .post("/api/permiso")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidPermiso);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        "Tipo de datos inválido para 'nombre'",
      ]);
    });
  });

  describe("PATCH /api/permiso/:id", () => {
    it("debe actualizar un permiso", async () => {
      const updatedPermiso = {
        nombre: "PermisoActualizado",
        descripcion: "Descripción actualizada",
      };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, ...updatedPermiso }]]);

      const response = await request(app)
        .patch("/api/permiso/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedPermiso);

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedPermiso.nombre);
      expect(response.body.descripcion).toBe(updatedPermiso.descripcion);
    });

    it("debe devolver 404 si el permiso no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/permiso/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ "nombre": "Permiso inexistente" });

      expect(response.status).toBe(404);
      expect(response.body.message).toEqual(
        "Permiso no encontrado"
      );
    });
  });

  describe("DELETE /api/permiso/:id", () => {
    it("debe eliminar un permiso", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/permiso/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver 404 si el permiso no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/permiso/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Permiso no encontrado");
    });
  });
});