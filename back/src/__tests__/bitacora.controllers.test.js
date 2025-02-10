import request from "supertest";
import { app } from "../app"; // Asegúrate de importar tu aplicación Express
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
    it("debe insertar una bitácora correctamente y devolver un status 201", async () => {
      const newBitacora = {
        personal_id: 30,
        compania_id: 16,
        maquina_id: 8,
        clave_id: 11,
        direccion: "123 Calle Ejemplo",
        f_salida: "04-11-2024",  // fecha pasada
        h_salida: "08:50",
        km_salida: 50.5,
        km_llegada: 75.0,
        hmetro_salida: 30.0,
        hmetro_llegada: 45.0,
        hbomba_salida: 15.0,
        hbomba_llegada: 20.0,
        obs: "Observaciones opcionales",
      };
    
      // Simulando que la máquina, el personal, la clave y la compañía existen
      mockQueryResponse([
        [{ id: 16 }],  // Compañía válida
        [{ id: 30 }],  // Personal válido
        [{ id: 8 }],   // Máquina válida
        [{ id: 11 }],  // Clave válida
        { insertId: 1 } // Simula la inserción exitosa
      ]);
    
      const response = await request(app)
        .post("/api/bitacora")
        .set("Authorization", `Bearer ${token}`)
        .send(newBitacora);
    
      console.log(response.body);
    
      expect(response.status).toBe(201);  // Esperamos un 201 al ser exitosa la inserción
      // expect(response.body).toHaveProperty("id");  // Esperamos que el ID de la nueva bitácora esté presente
      expect(response.body.compania_id).toBe(newBitacora.compania_id);
      expect(response.body.personal_id).toBe(newBitacora.personal_id);
      expect(response.body.maquina_id).toBe(newBitacora.maquina_id);
      expect(response.body.direccion).toBe(newBitacora.direccion);
      expect(response.body.fh_salida).toBe("2024-11-04 08:50:00");  // Fecha y hora de salida en formato MySQL
      expect(response.body.km_salida).toBe(newBitacora.km_salida);
      expect(response.body.km_llegada).toBe(newBitacora.km_llegada);
      expect(response.body.hmetro_salida).toBe(newBitacora.hmetro_salida);
      expect(response.body.hmetro_llegada).toBe(newBitacora.hmetro_llegada);
      expect(response.body.hbomba_salida).toBe(newBitacora.hbomba_salida);
      expect(response.body.hbomba_llegada).toBe(newBitacora.hbomba_llegada);
      expect(response.body.obs).toBe(newBitacora.obs);
    });
    
  
    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidBitacora = { direccion: "" }; // Datos inválidos
  
      // Simulando que la máquina, el personal y la clave existen
      mockQueryResponse([
        { disponible: 1 },
        { disponible: 1 },
      ]);
  
      const response = await request(app)
        .post("/api/bitacora")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidBitacora);
  
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        "Tipo de datos inválido.",
        "compania no existe o está eliminado",
        "maquina no existe o está eliminado",
        "clave no existe o está eliminado",
      ]);
    });
  
    it("debe devolver un error 400 si la máquina no está disponible", async () => {
      const newBitacora = {
        compania_id: 1,
        personal_id: 1,
        maquina_id: 1,
        direccion: "Calle Falsa 123",
        f_salida: "01-01-2029",
        h_salida: "12:00",
        clave_id: 1,
        km_salida: 10,
        km_llegada: 20,
        hmetro_salida: 5,
        hmetro_llegada: 10,
        hbomba_salida: 1,
        hbomba_llegada: 2,
        obs: "Observaciones",
      };
  
      // Simulando que la máquina no existe o está eliminada
      mockQueryResponse([
        { insertId: 1 },  // Simula una inserción exitosa
        { disponible: 0 },  // Máquina no disponible
        { disponible: 1 },  // Personal disponible
      ]);
  
      const response = await request(app)
        .post("/api/bitacora")
        .set("Authorization", `Bearer ${token}`)
        .send(newBitacora);
  
      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("maquina no existe o está eliminado");
    });
  
    it("debe devolver un error 400 si el personal no está disponible", async () => {
      const newBitacora = {
        compania_id: 1,
        personal_id: 1,
        maquina_id: 1,
        direccion: "Calle Falsa 123",
        f_salida: "01-01-2029",
        h_salida: "12:00",
        clave_id: 1,
        km_salida: 10,
        km_llegada: 20,
        hmetro_salida: 5,
        hmetro_llegada: 10,
        hbomba_salida: 1,
        hbomba_llegada: 2,
        obs: "Observaciones",
      };
  
      // Simulando que el personal no existe o está eliminado
      mockQueryResponse([
        { insertId: 1 },  // Simula una inserción exitosa
        { disponible: 1 },  // Máquina disponible
        { disponible: 0 },  // Personal no disponible
      ]);
  
      const response = await request(app)
        .post("/api/bitacora")
        .set("Authorization", `Bearer ${token}`)
        .send(newBitacora);
  
      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("personal no existe o está eliminado");
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