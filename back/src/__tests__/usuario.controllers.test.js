import request from "supertest";
import { app } from "../app";
import { pool } from "../db.js";
import { TOKEN_TEST } from "../config.js";
import bcrypt from 'bcrypt';

jest.mock("../db.js", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const token = TOKEN_TEST; // Asigna el valor del token aquí

describe("Usuario Controller", () => {
  // Función reutilizable para manejar las respuestas de las consultas
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener todos los usuarios
  describe("GET /api/usuario", () => {
    it("debe devolver la lista de usuarios", async () => {
      const mockData = [
        {
          id: 1,
          username: "usuario1",
          correo: "usuario1@example.com",
          // Agrega otros campos según sea necesario
        },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/usuario?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/usuario")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener un usuario por ID
  describe("GET /api/usuario/:id", () => {
    it("debe devolver el usuario solicitado", async () => {
      const mockUsuario = {
        id: 1,
        username: "usuario1",
        correo: "usuario1@example.com",
      };

      mockQueryResponse([[mockUsuario]]);

      const response = await request(app)
        .get("/api/usuario/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsuario);
    });

    it("debe devolver 404 si el usuario no se encuentra", async () => {
      mockQueryResponse([[]]); // No se encuentra el usuario

      const response = await request(app)
        .get("/api/usuario/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Usuario no encontrado");
    });
  });

  // Test para registrar un nuevo usuario
  describe("POST /api/usuario/register", () => {
    it("debe registrar un nuevo usuario", async () => {
      const newUsuario = {
        username: "nuevoUsuario",
        correo: "nuevo@example.com",
        contrasena: "SecurePass321",
        personal_id: 1,
      };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post("/api/usuario/register")
        .send(newUsuario);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Usuario registrado exitosamente. Se ha enviado un correo de verificación.");
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidUsuario = { username: "", correo: "invalid", contrasena: "123" }; // Datos inválidos

      const response = await request(app)
        .post("/api/usuario/register")
        .send(invalidUsuario);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Errores en los campos");
    });
  });

  // Test para iniciar sesión
  describe("POST /api/usuario/login", () => {
    it("debe iniciar sesión correctamente", async () => {
      const loginData = {
        username: "usuario1",
        contrasena: "password123",
      };

      const mockUser = {
        id: 1,
        username: "usuario1",
        contrasena: await bcrypt.hash("password123", 10), // Asegúrate de encriptar la contraseña
        personal_id: 1,
      };

      mockQueryResponse([[mockUser]]);

      const response = await request(app)
        .post("/api/usuario/login")
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Inicio de sesión exitoso");
      expect(response.body.token).toBeDefined();
    });

    it("debe devolver un error 400 si la contraseña es incorrecta", async () => {
      const loginData = {
        username: "usuario1",
        contrasena: "wrongpassword",
      };

      mockQueryResponse([[{ id: 1, username: "usuario1", contrasena: "hashedpassword" }]]); // Simula un usuario existente

      const response = await request(app)
        .post("/api/usuario/login")
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("Contraseña incorrecta");
    });
  });

  // Test para eliminar un usuario
  describe("DELETE /api/usuario/:id", () => {
    it("debe eliminar el usuario correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/usuario/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si el usuario no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/usuario/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Usuario no encontrado");
    });
  });

  // Test para actualizar un usuario
  describe("PATCH /api/usuario/:id", () => {
    it("debe actualizar el usuario correctamente", async () => {
      const updatedUsuario = {
        username: "usuarioActualizado",
        correo: "actualizado@example.com",
      };

      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .patch("/api/usuario/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedUsuario);

      expect(response.status).toBe(200);
    });

    it("debe devolver un error 404 si el usuario no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/usuario/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "nuevoNombre" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Usuario no encontrado");
    });
  });
});