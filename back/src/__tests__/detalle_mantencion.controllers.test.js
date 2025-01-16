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

describe("Detalle Mantencion Controller", () => {
  const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  // Test para obtener detalles de mantención con paginación
  describe("GET /api/detalle_mantencion", () => {
    it("debe devolver la lista de detalles de mantención con paginación", async () => {
      const mockData = [
        { id: 1, mantencion_id: 1, observacion: "Observación 1", servicio_id: 1 },
        { id: 2, mantencion_id: 1, observacion: "Observación 2", servicio_id: 2 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/detalle_mantencion?page=1&pageSize=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it("debe devolver un error 500 si ocurre un error en la base de datos", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/detalle_mantencion")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  // Test para obtener un detalle de mantención por ID
  describe("GET /api/detalle_mantencion/:id", () => {
    it("debe devolver el detalle de mantención solicitado", async () => {
      const mockDetalle = {
        id: 1,
        mantencion_id: 1,
        observacion: "Observación 1",
        servicio_id: 1,
      };

      mockQueryResponse([[mockDetalle]]);

      const response = await request(app)
        .get("/api/detalle_mantencion/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDetalle);
    });

    it("debe devolver 404 si el detalle no se encuentra", async () => {
      mockQueryResponse([[]]); // No se encuentra el detalle

      const response = await request(app)
        .get("/api/detalle_mantencion/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Detalle de mantención no encontrado");
    });
  });

  describe("POST /api/detalle_mantencion", () => {
    it("debe crear un nuevo detalle de mantención", async () => {
        const newDetalle = {
            mantencion_id: 1,
            observacion: "Nueva observación",
            servicio_id: 1,
        };

        // Mock para simular la existencia de mantención y servicio
        mockQueryResponse([{ "1": 1 }], "SELECT 1 FROM mantencion WHERE id = ? AND isDeleted = 0");
        mockQueryResponse([{ "1": 1 }], "SELECT 1 FROM servicio WHERE id = ? AND isDeleted = 0");
        mockQueryResponse([{ insertId: 1 }], "INSERT INTO detalle_mantencion");

        const response = await request(app)
            .post("/api/detalle_mantencion")
            .set("Authorization", `Bearer ${token}`)
            .send(newDetalle);

        expect(response.status).toBe(201);
        expect(response.body.id).toBe(1);
        expect(response.body.mantencion_id).toBe(newDetalle.mantencion_id);
    });

    it("debe devolver un error 400 si los datos son inválidos", async () => {
        const invalidDetalle = { mantencion_id: 999, observacion: "", servicio_id: 1 };

        // Mock para simular la no existencia de mantención
        mockQueryResponse([], "SELECT 1 FROM mantencion WHERE id = ? AND isDeleted = 0");

        const response = await request(app)
            .post("/api/detalle_mantencion")
            .set("Authorization", `Bearer ${token}`)
            .send(invalidDetalle);

        expect(response.status).toBe(400);
        expect(response.body.errors).toContain("Mantención no existe o está eliminada");
    });
});


  // Test para eliminar un detalle de mantención
  describe("DELETE /api/detalle_mantencion/:id", () => {
    it("debe eliminar el detalle de mantención correctamente", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/detalle_mantencion/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("debe devolver un error 404 si el detalle no se encuentra", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete("/api/detalle_mantencion/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Detalle de mantención no encontrado");
    });
  });

  // Test para actualizar un detalle de mantención
  describe("PATCH /api/detalle_mantencion/:id", () => {
    it("debe actualizar el detalle de mantención correctamente", async () => {
      const updatedDetalle = {
        mantencion_id: 1,
        observacion: "Observación actualizada",
        servicio_id: 1,
      };

      mockQueryResponse([{ affectedRows: 1 }]);
      mockQueryResponse([[{ id: 1, ...updatedDetalle }]]);

      const response = await request(app)
        .patch("/api/detalle_mantencion/1")
        .set("Authorization", `Bearer ${token}`)
        .send(updatedDetalle);

      expect(response.status).toBe(200);
      expect(response.body.observacion).toBe(updatedDetalle.observacion);
    });
    
    it("debe devolver un error 404 si el detalle no existe", async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch("/api/detalle_mantencion/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ observacion: "Nueva observación" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Detalle de mantención no encontrado");
    });


    //TODO: arreglar el test 
    it("debe devolver un error 400 si los datos son inválidos", async () => {
      const invalidDetalle = {
        mantencion_id: "abc", // Mantención que no existe
      };
    
      const response = await request(app)
        .patch("/api/detalle_mantencion/1") // ID válido de detalle_mantencion
        .set("Authorization", `Bearer ${token}`) // Token de autorización
        .send(invalidDetalle);
    
      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("Mantención no existe o está eliminada");
    });    
  });
});