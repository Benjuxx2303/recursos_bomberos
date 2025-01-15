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

describe("Subdivision Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener todas las subdivisiones con paginación
  describe("GET /api/subdivision", () => {
    it("debe devolver la lista de subdivisiones con paginación", async () => {
      const mockData = [
        { id: 1, nombre: "Subdivisión 1", division: "División A" },
        { id: 2, nombre: "Subdivisión 2", division: "División B" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/subdivision?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/subdivision")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener una subdivisión por ID
  describe("GET /api/subdivision/:id", () => {
    it("debe devolver la subdivisión solicitada", async () => {
      const mockSubdivision = {
        id: 1,
        nombre: "Subdivisión 1",
        division: "División A",
      };

      mockQueryResponse([[mockSubdivision]]);

      const response = await request(app)
        .get("/api/subdivision/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSubdivision);
    });

    it("debe devolver 404 si la subdivisión no se encuentra", async () => {
      mockQueryResponse([[]]); // No se encuentra la subdivisión

      const response = await request(app)
        .get("/api/subdivision/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Subdivisión no encontrada");
    });
  });

  // Test para crear una nueva subdivisión
  describe("POST /api/subdivision", () => {
    it("debe crear una nueva subdivisión", async () => {
      const newSubdivision = {
        division_id: 1,
        nombre: "Nueva Subdivisión",
      };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/subdivision")
        .set("Authorization", `Bearer ${token}`)
        .send(newSubdivision);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newSubdivision.nombre);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidSubdivision = { division_id: 1, nombre: "" }; // Datos inválidos

      const response = await request(app)
        .post("/api/subdivision")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidSubdivision);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("Campo 'nombre' no debe estar vacío");
    });

    it("debe devolver un error 400 si el nombre excede los 45 caracteres", async () => {
      const invalidSubdivision = {
        division_id: 1,
        nombre: "Subdivisión con un nombre excesivamente largo que supera los 45 caracteres",
      };

      const response = await request(app)
        .post("/api/subdivision")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidSubdivision);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("Longitud de 'nombre' no debe exceder 45 caracteres");
    });
  });

  // Test para eliminar una subdivisión
  describe("DELETE /api/subdivision/:id", () => {
    it("debe eliminar la subdivisión correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/subdivision/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si la subdivisión no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/subdivision/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Subdivisión no encontrada");
    });
  });

  // Test para actualizar una subdivisión
  describe("PATCH /api/subdivision/:id", () => {
    it("debe actualizar la subdivisión correctamente", async () => {
      const updatedSubdivision = {
        division_id: 1,
        nombre: "Subdivisión Actualizada",
      };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, nombre: updatedSubdivision.nombre }]]);

      const response = await request(app)
        .patch("/api/subdivision/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedSubdivision);

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedSubdivision.nombre);
    });

    it("debe devolver un error 404 si la subdivisión no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/subdivision/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: "Subdivisión Inexistente" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Subdivisión no encontrada");
    });

    it("debe devolver un error 400 si el nombre excede los 45 caracteres", async () => {
      const invalidSubdivision = {
        division_id: 1,
        nombre: "Subdivisión con un nombre excesivamente largo que supera los 45 caracteres",
      };

      const response = await request(app)
        .patch("/api/subdivision/1")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidSubdivision);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("Longitud de 'nombre' no debe exceder 45 caracteres");
    });
  });
});