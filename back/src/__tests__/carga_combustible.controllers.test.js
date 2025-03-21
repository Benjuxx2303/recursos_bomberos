import request from "supertest";
import { app } from "../app"; // Asegúrate de importar tu aplicación Express
import { pool } from "../db.js";
import { TOKEN_TEST } from "../config.js";

jest.mock("../db.js", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const token = TOKEN_TEST; // Asigna el valor del token aquí

describe("Carga Combustible Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener cargas de combustible con paginación
  describe("GET /api/carga_combustible", () => {
    it("debe devolver la lista de cargas de combustible con paginación", async () => {
      const mockData = [
        { id: 1, litros: 100, valor_mon: 50000 },
        { id: 2, litros: 200, valor_mon: 100000 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/carga_combustible?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/carga_combustible")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener una carga de combustible por ID
  describe("GET /api/carga_combustible/:id", () => {
    it("debe devolver la carga de combustible solicitada", async () => {
      const mockCarga = {
        id: 1,
        litros: 100,
        valor_mon: 50000,
      };

      mockQueryResponse([[mockCarga]]);

      const response = await request(app)
        .get("/api/carga_combustible/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCarga);
    });

    it("debe devolver 404 si la carga de combustible no se encuentra", async () => {
      mockQueryResponse([[]]); // No se encuentra la carga

      const response = await request(app)
        .get("/api/carga_combustible/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Carga de combustible no encontrada");
    });
  });

  // Test para crear una nueva carga de combustible
  describe("POST /api/carga_combustible/simple", () => {
    it("debe crear una nueva carga de combustible", async () => {
      const newCarga = {
        bitacora_id: 1,
        litros: 50,
        valor_mon: 150.75,
      };
    
      // Simulando la respuesta de la base de datos para la consulta de la bitácora
      mockQueryResponse([
        [{ id: 1, codigo: "ABC123", compania_id: 1 }], // Respuesta simulada que la bitácora existe y no está eliminada
        [], // No existe una carga de combustible asociada (cargaExistente)
        [], // No existe una mantención asociada (mantencionExistente)
      ]);
    
      // Simulando la inserción de la nueva carga de combustible
      mockQueryResponse([{ insertId: 1 }]);
    
      const response = await request(app)
        .post("/api/carga_combustible/simple")
        .set("Authorization", `Bearer ${token}`)
        .send(newCarga);
    
      console.log(response.body);
    
      // Validar que la respuesta sea la esperada
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.litros).toBe(newCarga.litros);
      expect(response.body.valor_mon).toBe(newCarga.valor_mon);
    });
    
    
    
  
    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidCarga = { bitacora_id: 1, litros: -10, valor_mon: -500 }; // Datos inválidos
  
      const response = await request(app)
        .post("/api/carga_combustible/simple")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidCarga);
  
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        "El valor no puede ser negativo.",
        "El valor no puede ser negativo.",
      ]);
    });
  
    it("debe devolver un error 400 si la bitácora no existe o está eliminada", async () => {
      const cargaSinBitacora = {
        bitacora_id: 999, // ID de bitácora inexistente
        litros: 50,
        valor_mon: 150.75,
      };
  
      // Simulando respuesta con bitácora no existente
      mockQueryResponse([]);
  
      const response = await request(app)
        .post("/api/carga_combustible/simple")
        .set("Authorization", `Bearer ${token}`)
        .send(cargaSinBitacora);
  
        console.log(response.body)
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Bitácora no existe o está eliminada");
    });
  
    it("debe devolver un error 400 si ya existe un servicio asociado a la bitácora", async () => {
      const cargaConServicioExistente = {
        bitacora_id: 1,
        litros: 50,
        valor_mon: 150.75,
      };
  
      // Simulando que la bitácora existe
      mockQueryResponse([
        [{ id: 1, codigo: "ABC123", compania_id: 1 }], // Respuesta para la consulta de bitácora
        [{ "1": 1 }], // Simula que ya existe una carga
        [] // No hay mantención asociada
      ]);
  
      const response = await request(app)
        .post("/api/carga_combustible/simple")
        .set("Authorization", `Bearer ${token}`)
        .send(cargaConServicioExistente);
  
      console.log(response.body);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Ya existe un servicio asociado a esta bitácora");
    });
  });

  // Test para eliminar una carga de combustible
  describe("DELETE /api/carga_combustible/:id", () => {
    it("debe eliminar la carga correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/carga_combustible/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si la carga no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/carga_combustible/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Carga de combustible no encontrada");
    });
  });

  // Test para actualizar una carga de combustible
  describe("PATCH /api/carga_combustible/:id", () => {
    it("debe actualizar la carga correctamente", async () => {
      const updatedCarga = {
        litros: 150,
        valor_mon: 75000,
      };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, litros: updatedCarga.litros }]]); // Simulamos la obtención de la carga actualizada

      const response = await request(app)
        .patch("/api/carga_combustible/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedCarga);

      expect(response.status).toBe(200);
      expect(response.body.litros).toBe(updatedCarga.litros);
    });

    it("debe devolver un error 404 si la carga no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/carga_combustible/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ litros: 150 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Carga de Combustible no encontrada");
    });
  });
});