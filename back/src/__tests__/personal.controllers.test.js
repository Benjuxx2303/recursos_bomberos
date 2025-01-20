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

// Función reutilizable para manejar las respuestas de las consultas
const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
const mockQueryError = (error) => pool.query.mockRejectedValue(error);

describe("Personal Controller", () => {
  // Test para obtener la lista de personal (paginado)
  describe("GET /api/personal", () => {
    it("debe devolver la lista paginada de personal", async () => {
      const mockData = [
        { id: 1, nombre: "Juan", apellido: "Pérez", rut: "12345678-9" },
        { id: 2, nombre: "María", apellido: "López", rut: "98765432-1" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/personal?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/personal")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener un personal por ID
  describe("GET /api/personal/:id", () => {
    it("debe devolver los detalles de un personal por ID", async () => {
      const mockData = {
        id: 1,
        nombre: "Juan",
        apellido: "Pérez",
        rut: "12345678-9",
      };

      mockQueryResponse([[mockData]]);

      const response = await request(app)
        .get("/api/personal/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver 404 si el personal no se encuentra", async () => {
      mockQueryResponse([[]]);

      const response = await request(app)
        .get("/api/personal/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Personal no encontrado");
    });
  });

  // Test para crear un nuevo personal
  describe("POST /api/personal", () => {
    it("debe crear un nuevo personal", async () => {
      const newPersonal = {
        rol_personal_id: 1,
        compania_id: 1,
        rut: "19643285-K",
        nombre: "Juan",
        apellido: "Zarate",
        fec_nac: "01-01-1990"
    };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/personal")
        .set("Authorization", `Bearer ${token}`)
        .send(newPersonal);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newPersonal.nombre);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidData = { nombre: "", apellido: "", rut: "" };

      const response = await request(app)
        .post("/api/personal")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("Tipo de datos inválido");
    });
  });

  // Test para eliminar un personal
  describe("DELETE /api/personal/:id", () => {
    it("debe dar de baja un personal", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/personal/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver 404 si el personal no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/personal/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Personal no encontrado");
    });
  });

  // Test para actualizar un personal
  describe("PATCH /api/personal/:id", () => {
    it("debe actualizar un personal", async () => {
      const updatedData = { nombre: "Actualizado", apellido: "Apellido" };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, nombre: updatedData.nombre, apellido: updatedData.apellido }]]);

      const response = await request(app)
        .patch("/api/personal/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedData.nombre);
    });

    it("debe devolver 404 si el personal no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/personal/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: "No existe" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Personal no encontrado");
    });
  });

  // Test para activar un personal
  describe("PATCH /api/personal/activate", () => {
    it("debe activar un personal por ID", async () => {
      const mockData = { affectedRows: 1 };

      mockQueryResponse([mockData]);

      const response = await request(app)
        .patch("/api/personal/activate?id=1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Personal activado exitosamente");
    });

    it("debe activar un personal por RUT", async () => {
      const mockData = { affectedRows: 1 };

      mockQueryResponse([mockData]);

      const response = await request(app)
        .patch("/api/personal/activate?rut=12345678-9")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Personal activado exitosamente");
    });

    it("debe devolver 400 si se proporcionan tanto ID como RUT", async () => {
      const response = await request(app)
        .patch("/api/personal/activate?id=1&rut=12345678-9")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Debes proporcionar solo un parámetro: id o rut."
      );
    });

    it("debe devolver 400 si no se proporciona ni ID ni RUT", async () => {
      const response = await request(app)
        .patch("/api/personal/activate")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Debes proporcionar solo un parámetro: id o rut."
      );
    });

    it("debe devolver 404 si no se encuentra el personal", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/personal/activate?id=999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        "Personal no encontrado con el id especificado"
      );
    });

    it("debe devolver 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .patch("/api/personal/activate?id=1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para desactivar un personal
  describe("PATCH /api/personal/deactivate", () => {
    it("debe desactivar un personal por ID", async () => {
      const mockData = { affectedRows: 1 };

      mockQueryResponse([mockData]);

      const response = await request(app)
        .patch("/api/personal/deactivate?id=1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Personal desactivado exitosamente");
    });

    it("debe desactivar un personal por RUT", async () => {
      const mockData = { affectedRows: 1 };

      mockQueryResponse([mockData]);

      const response = await request(app)
        .patch("/api/personal/deactivate?rut=12345678-9")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Personal desactivado exitosamente");
    });

    it("debe devolver 400 si se proporcionan tanto ID como RUT", async () => {
      const response = await request(app)
        .patch("/api/personal/deactivate?id=1&rut=12345678-9")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Debes proporcionar solo un parámetro: id o rut."
      );
    });

    it("debe devolver 400 si no se proporciona ni ID ni RUT", async () => {
      const response = await request(app)
        .patch("/api/personal/deactivate")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Debes proporcionar solo un parámetro: id o rut."
      );
    });

    it("debe devolver 404 si no se encuentra el personal", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/personal/deactivate?id=999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        "Personal no encontrado con el id especificado"
      );
    });

    it("debe devolver 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .patch("/api/personal/deactivate?id=1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });
});