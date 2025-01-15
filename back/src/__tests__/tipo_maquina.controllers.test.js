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

describe("Tipo Máquina Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  describe("GET /api/tipo_maquina", () => {
    it("debe devolver una lista de tipos de máquina con paginación", async () => {
      const mockData = [
        { id: 1, nombre: "Maquina1", descripcion: "Descripción 1" },
        { id: 2, nombre: "Maquina2", descripcion: "Descripción 2" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/tipo_maquina?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/tipo_maquina")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  describe("GET /api/tipo_maquina/:id", () => {
    it("debe devolver un tipo de máquina por ID", async () => {
      const mockTipoMaquina = { id: 1, nombre: "Maquina1", descripcion: "Descripción 1" };

      mockQueryResponse([[mockTipoMaquina]]);

      const response = await request(app)
        .get("/api/tipo_maquina/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTipoMaquina);
    });

    it("debe devolver 404 si el tipo de máquina no se encuentra", async () => {
      mockQueryResponse([[]]);

      const response = await request(app)
        .get("/api/tipo_maquina/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tipo de máquina no encontrado");
    });
  });

  describe("POST /api/tipo_maquina", () => {
    it("debe crear un nuevo tipo de máquina", async () => {
      const newTipoMaquina = { nombre: "NuevaMaquina", descripcion: "Nueva descripción" };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/tipo_maquina")
        .set("Authorization", `Bearer ${token}`)
        .send(newTipoMaquina);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newTipoMaquina.nombre);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidTipoMaquina = { nombre: "", descripcion: "" };

      const response = await request(app)
        .post("/api/tipo_maquina")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidTipoMaquina);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("El campo \"nombre\" no puede estar vacío");
    });
  });

  describe("DELETE /api/tipo_maquina/:id", () => {
    it("debe eliminar un tipo de máquina", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/tipo_maquina/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver 404 si el tipo de máquina no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/tipo_maquina/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tipo de máquina no encontrado");
    });
  });

  describe("PATCH /api/tipo_maquina/:id", () => {
    it("debe actualizar un tipo de máquina", async () => {
      const updatedTipoMaquina = { nombre: "MaquinaActualizada", descripcion: "Descripción actualizada" };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[updatedTipoMaquina]]);

      const response = await request(app)
        .patch("/api/tipo_maquina/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedTipoMaquina);

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedTipoMaquina.nombre);
    });

    it("debe devolver 400 si los datos son inválidos", async () => {
      const invalidTipoMaquina = { nombre: "NombreMuyLargoQueExcedeElLimite", descripcion: "Descripción válida" };

      const response = await request(app)
        .patch("/api/tipo_maquina/1")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidTipoMaquina);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("La clasificación debe tener un largo máximo de 50 caracteres");
    });
  });
});
