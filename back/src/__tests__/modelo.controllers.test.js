import request from "supertest";
import app from "../app.js"; // Asegúrate de importar tu aplicación Express
import { pool } from "../db.js";
import { TOKEN_TEST } from "../config.js";

jest.mock("../db.js", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const token = TOKEN_TEST; // Asigna el valor del token aquí

describe("Modelo Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener todos los modelos
  describe("GET /api/modelo", () => {
    it("debe devolver la lista de modelos", async () => {
      const mockData = [
        { id: 1, nombre: "Modelo1" },
        { id: 2, nombre: "Modelo2" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/modelo")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/modelo")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener un modelo por ID
  describe("GET /api/modelo/:id", () => {
    it("debe devolver el modelo solicitado", async () => {
      const mockModelo = {
        id: 1,
        nombre: "Modelo1",
      };

      mockQueryResponse([[mockModelo]]);

      const response = await request(app)
        .get("/api/modelo/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockModelo);
    });

    it("debe devolver 404 si el modelo no se encuentra", async () => {
      mockQueryResponse([[]]); // No se encuentra el modelo

      const response = await request(app)
        .get("/api/modelo/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Modelo no encontrado");
    });
  });

  // Test para crear un nuevo modelo
  describe("POST /api/modelo", () => {
    it("debe crear un nuevo modelo", async () => {
      const newModelo = {
        nombre: "ModeloNuevo",
        marca_id: 1,
        tipo_maquina_id: 1,
      };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/modelo")
        .set("Authorization", `Bearer ${token}`)
        .send(newModelo);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newModelo.nombre);
    });

    it("debe devolver un error 400 si el nombre es inválido", async () => {
      const invalidModelo = { nombre: 123 }; // Datos inválidos

      const response = await request(app)
        .post("/api/modelo")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidModelo);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Datos inválidos');
    });
  });

  // Test para eliminar un modelo
  describe("DELETE /api/modelo/:id", () => {
    it("debe eliminar el modelo correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/modelo/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si el modelo no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/modelo/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Modelo no encontrado");
    });
  });

  // Test para actualizar un modelo
  describe("PATCH /api/modelo/:id", () => {
    it("debe actualizar el modelo correctamente", async () => {
      const updatedModelo = {
        nombre: "ModeloActualizado",
        marca_id: 1,
        tipo_maquina_id: 1
      };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, nombre: "ModeloActualizado" }]]);

      const response = await request(app)
        .patch("/api/modelo/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedModelo);

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedModelo.nombre);
    });

    it("debe devolver un error 404 si el modelo no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]); // No se encuentra el modelo
   
      const response = await request(app)
        .patch("/api/modelo/999")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nombre: "ModeloNoExistente",
          marca_id: 1, // Asegúrate de enviar todos los parámetros necesarios
          tipo_maquina_id: 2
        });
   
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Modelo no encontrado");
    });
   

    it("debe devolver un error 400 si el nombre es inválido", async () => {
      const invalidModelo = {
        nombre: 123, // Datos inválidos
      };

      const response = await request(app)
        .patch("/api/modelo/1")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidModelo);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Tipo de dato inválido para "nombre"');
    });
  });
});