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

describe("Clave Controller", () => {
  // Función reutilizable para manejar las respuestas de las consultas
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener claves con paginación
  describe("GET /api/clave", () => {
    it("debe devolver la lista de claves con paginación", async () => {
      const mockData = [
        { id: 1, nombre: "Clave1", descripcion: "Descripción clave 1" },
        { id: 2, nombre: "Clave2", descripcion: "Descripción clave 2" },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/clave?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/clave")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener una clave por ID
  describe("GET /api/clave/:id", () => {
    it("debe devolver la clave solicitada", async () => {
      const mockClave = {
        id: 1,
        nombre: "Clave1",
        descripcion: "Descripción clave 1",
      };

      mockQueryResponse([[mockClave]]);

      const response = await request(app)
        .get("/api/clave/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockClave);
    });

    it("debe devolver 404 si la clave no se encuentra", async () => {
      mockQueryResponse([[]]); // No se encuentra la clave

      const response = await request(app)
        .get("/api/clave/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Clave no encontrada");
    });
  });

  // Test para crear una nueva clave
  describe("POST /api/clave", () => {
    it("debe crear una nueva clave", async () => {
      const newClave = {
        nombre: "ClaveNuevo",
        descripcion: "Descripción de la nueva clave",
        tipo_clave_id: 1,
      };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/clave")
        .set("Authorization", `Bearer ${token}`)
        .send(newClave);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newClave.nombre);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidClave = { nombre: "", descripcion: "", tipo_clave_id: 1 }; // Datos inválidos

      const response = await request(app)
        .post("/api/clave")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidClave);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        'El campo "nombre" no puede estar vacío',
        'El campo "descripcion" no puede estar vacío',
      ]);
    });

    it("debe devolver un error 400 si el nombre excede los 10 caracteres", async () => {
      const invalidClave = {
        nombre: "ClaveExcesiva12312352513",
        descripcion: "Descripción válida",
        tipo_clave_id: 5,
      };

      const response = await request(app)
        .post("/api/clave")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidClave);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        "El largo del código no debe exceder 10 caracteres",
      ]);
    });

    it("debe devolver un error 400 si la descripción excede los 100 caracteres", async () => {
      const invalidClave = {
        nombre: "AX123",
        descripcion: "Descripción con más de cien caracteres, que debería generar un error. xdddddasdfasdfadfasdfadfsadsfadsfasdf".repeat(2),
        tipo_clave_id: 1,
      };

      const response = await request(app)
        .post("/api/clave")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidClave);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        "El largo de la descripción no debe exceder 100 caracteres",
      ]);
    });
  });

  // Test para eliminar una clave
  describe("DELETE /api/clave/:id", () => {
    it("debe eliminar la clave correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/clave/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si la clave no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/clave/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Clave no encontrada");
    });
  });

  // Test para actualizar una clave
  describe("PATCH /api/clave/:id", () => {
    it("debe actualizar la clave correctamente", async () => {
      const updatedClave = {
          nombre: "AZ123",  // Nombre actualizado
          descripcion: "Descripción actualizada",
          tipo_clave_id: 1,
      };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1,nombre: updatedClave.nombre, descripcion: updatedClave.descripcion }]]);
  
      const response = await request(app)
          .patch("/api/clave/5")
          .set("Authorization", `Bearer ${token}`)
          .send(updatedClave);
  
      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedClave.nombre);
      expect(response.body.descripcion).toBe(updatedClave.descripcion);
  });
  

    it("debe devolver un error 404 si la clave no existe", async () => {
        // Simulamos que la clave no se encuentra
        mockQueryResponse([[]]); // No se encuentra la clave con el ID dado

        // Realizamos la solicitud PATCH con un ID no existente
        const response = await request(app)
            .patch("/api/clave/999") // Usamos un ID que no existe
            .set("Authorization", `Bearer ${token}`) // Añadimos el token de autorización si es necesario
            .send({ nombre: "Clave No Existe" }); // Enviamos los datos para actualizar, aunque la clave no exista

        // Verificamos que la respuesta sea un error 404
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Clave no encontrada");
    });

    it("debe devolver un error 400 si el nombre excede los 10 caracteres", async () => {
        const invalidClave = {
            nombre: "ClaveMuyLargaExcesiva123456789",
            descripcion: "Descripción válida",
            tipo_clave_id: 1,
        };

        mockQueryResponse([[{ id: 1, nombre: "Clave1", descripcion: "Descripción clave 1", tipo_clave_id: 1 }]]);
        mockQueryResponse([[{ id: 1, nombre: "TipoClave1" }]]); // Simulamos que tipo_clave_id = 1 existe

        const response = await request(app)
            .patch("/api/clave/1")
            .set("Authorization", `Bearer ${token}`)
            .send(invalidClave);

        expect(response.status).toBe(400);
        expect(response.body.errors).toContain("El largo del nombre no debe exceder 10 caracteres");
    });

    it("debe devolver un error 400 si el tipo_clave_id no existe", async () => {
      
      const invalidClave = {
          nombre: "AX90",
          descripcion: "Descripción válida",
          tipo_clave_id: 999,  // Tipo de clave que no existe
      };
  
      mockQueryResponse([[{ id: 1, nombre: "TipoClave1" }]]); // Simulamos que tipo_clave_id = 1 existe
      mockQueryResponse([[]]); // Simulamos que tipo_clave_id = 999 no existe

      const response = await request(app)
          .patch("/api/clave/1") // Suponiendo que el ID de la clave es 1
          .set("Authorization", `Bearer ${token}`)
          .send(invalidClave);
  
      expect(response.status).toBe(400);  // Ahora esperamos un error 400
      expect(response.body.errors).toContain("El tipo de clave no existe");
  });  
});
});