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

describe("Rol-Permiso Controller", () => {
  const mockQueryResponse = (response) =>
    pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  describe("GET /api/rol_permiso", () => {
    it("debe devolver una lista de rol-permisos", async () => {
      const mockData = [
        { id: 1, rol_personal_id: 1, permiso_id: 1, permiso_nombre: "Permiso1", rol_nombre: "Rol1" },
        { id: 2, rol_personal_id: 2, permiso_id: 2, permiso_nombre: "Permiso2", rol_nombre: "Rol2" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/rol_permiso")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/rol_permiso")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  describe("GET /api/rol_permiso/:id", () => {
    it("debe devolver un rol-permiso por ID", async () => {
      const mockRolPermiso = {
        id: 1,
        rol_personal_id: 1,
        permiso_id: 1,
        permiso_nombre: "Permiso1",
        rol_nombre: "Rol1",
      };

      mockQueryResponse([[mockRolPermiso]]);

      const response = await request(app)
        .get("/api/rol_permiso/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRolPermiso);
    });

    it("debe devolver 404 si el rol-permiso no se encuentra", async () => {
      mockQueryResponse([[]]);

      const response = await request(app)
        .get("/api/rol_permiso/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Rol-Permiso no encontrado");
    });
  });

  describe("POST /api/rol_permiso", () => {
    it("debe crear un nuevo rol-permiso", async () => {
      const newRolPermiso = {
        rol_personal_id: 1,
        permiso_id: 1,
      };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/rol_permiso")
        .set("Authorization", `Bearer ${token}`)
        .send(newRolPermiso);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.rol_personal_id).toBe(newRolPermiso.rol_personal_id);
      expect(response.body.permiso_id).toBe(newRolPermiso.permiso_id);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidRolPermiso = { rol_personal_id: null, permiso_id: null };

      const response = await request(app)
        .post("/api/rol_permiso")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidRolPermiso);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(["Faltan campos requeridos"]);
    });
  });

  describe("PATCH /api/rol_permiso/:id", () => {
    it("debe actualizar un rol-permiso", async () => {
      const updatedRolPermiso = {
        rol_personal_id: 1,
        permiso_id: 2,
      };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, ...updatedRolPermiso }]]);

      const response = await request(app)
        .patch("/api/rol_permiso/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedRolPermiso);

      expect(response.status).toBe(200);
      expect(response.body.rol_personal_id).toBe(updatedRolPermiso.rol_personal_id);
      expect(response.body.permiso_id).toBe(updatedRolPermiso.permiso_id);
    });

    it("debe devolver 404 si el rol-permiso no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/rol_permiso/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ rol_personal_id: 1, permiso_id: 2 });

      expect(response.status).toBe(404);
      expect(response.body.message).toEqual("Rol-Permiso no encontrado");
    });
  });

  describe("DELETE /api/rol_permiso/:id", () => {
    it("debe eliminar un rol-permiso", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/rol_permiso/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver 404 si el rol-permiso no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/rol_permiso/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Rol-Permiso no encontrado");
    });
  });
});