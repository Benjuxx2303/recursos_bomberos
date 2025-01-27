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

describe("Bitacora Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener la bitácora con paginación
  describe("GET /api/bitacora", () => {
    it("debe devolver la lista de bitácoras con paginación", async () => {
      const mockData = [
        { id: 1, compania: "Compania1", rut_conductor: "12345678-9" },
        { id: 2, compania: "Compania2", rut_conductor: "98765432-1" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/bitacora?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/bitacora")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener una bitácora por ID
  describe("GET /api/bitacora/:id", () => {
    it("debe devolver la bitácora solicitada", async () => {
      const mockBitacora = {
        id: 1,
        compania: "Compania1",
        rut_conductor: "12345678-9",
      };

      mockQueryResponse([[mockBitacora]]);

      const response = await request(app)
        .get("/api/bitacora/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBitacora);
    });

    it("debe devolver 404 si la bitácora no se encuentra", async () => {
      mockQueryResponse([[]]); // No se encuentra la bitácora

      const response = await request(app)
        .get("/api/bitacora/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Registro no encontrado");
    });
  });

  // Test para crear una nueva bitácora
  describe("POST /api/bitacora", () => {
    it("debe crear una nueva bitácora", async () => {
      const newBitacora = {
        compania_id: 1,
        personal_id: 1,
        maquina_id: 1,
        direccion: "Calle Falsa 123",
        f_salida: "01-01-2023",
        h_salida: "12:00",
        f_llegada: "01-01-2023",
        h_llegada: "14:00",
        clave_id: 1,
        km_salida: 10,
        km_llegada: 20,
        hmetro_salida: 5,
        hmetro_llegada: 10,
        hbomba_salida: 1,
        hbomba_llegada: 2,
        obs: "Observaciones",
      };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/bitacora")
        .set("Authorization", `Bearer ${token}`)
        .send(newBitacora);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.direccion).toBe(newBitacora.direccion);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidBitacora = { direccion: "" }; // Datos inválidos

      const response = await request(app)
        .post("/api/bitacora")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidBitacora);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        "Tipo de datos inválido",
        "Km llegada es requerido",
        "Km salida es requerido",
        "Hmetro llegada es requerido",
        "Hmetro salida es requerido",
        "Hbomba llegada es requerido",
        "Hbomba salida es requerido"
      ])
    });
  });

  // Test para eliminar una bitácora
  describe("DELETE /api/bitacora/:id", () => {
    it("debe eliminar la bitácora correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/bitacora/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si la bitácora no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/bitacora/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Bitácora no encontrada");
    });
  });

  /// Test para actualizar una bitácora
  describe("PATCH /api/bitacora/:id", () => {
    it("debe actualizar la bitácora correctamente", async () => {
      const updatedBitacora = {
        direccion: "Calle Actualizada 456",
      };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, direccion: updatedBitacora.direccion }]]);


      const response = await request(app)
        .patch("/api/bitacora/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedBitacora);

      expect(response.status).toBe(200);
      expect(response.body.direccion).toBe(updatedBitacora.direccion);
    });

    it("debe devolver un error 404 si la bitácora no existe", async () => {
      mockQueryResponse([[]]); // No se encuentra la bitácora

      const response = await request(app)
        .patch("/api/bitacora/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ direccion: "Calle No Existe" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Bitácora no encontrada o ya está eliminada");
    });
  });
});