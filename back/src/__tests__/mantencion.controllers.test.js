import request from "supertest";
import { app } from "../app";
import { pool } from "../db.js";
import { TOKEN_TEST } from "../config.js";

jest.mock("../db.js", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const token = TOKEN_TEST;

describe("Mantencion Controller", () => {
  const mockQueryResponse = (response) =>
    pool.query.mockResolvedValue(response);
  const mockQueryError = (error) => pool.query.mockRejectedValue(error);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/mantencion", () => {
    it("debe devolver la lista de mantenciones con parámetros de búsqueda", async () => {
      const mockData = [{ id: 1, patente: "ABC123" }];
      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/mantencion?page=1&pageSize=10&taller=TallerTest&estado_mantencion=Pendiente")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('rows');
    });

    it("debe manejar errores de consulta", async () => {
      mockQueryError(new Error("Database error"));

      const response = await request(app)
        .get("/api/mantencion")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  describe("GET /api/mantencion/:id", () => {
    it("debe devolver una mantención específica", async () => {
      const mockMantencion = {
        id: 1,
        "bitacora.id": 1 ,
        patente: "ABC123"
      };
      mockQueryResponse([[mockMantencion]]);

      const response = await request(app)
        .get("/api/mantencion/1")
        .set("Authorization", `Bearer ${token}`);

        console.log(response.body)
      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockMantencion]);
    });

    it("debe devolver 404 si la mantención no existe", async () => {
      mockQueryResponse([[]]);

      const response = await request(app)
        .get("/api/mantencion/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/mantencion/old", () => {
    it("debe crear una nueva mantención", async () => {
      // Mock de las consultas a la base de datos
      mockQueryResponse([[{ id: 1, personal_id: 1, codigo: "M123", compania_id: 1 }]]); // Mock para la bitácora
      mockQueryResponse([[{ id: 1 }]]); // Mock para la consulta de la compañía en la bitácora
      mockQueryResponse([[{ id: 1 }]]); // Mock para la consulta de la máquina (debe existir)
      mockQueryResponse([[{ id: 1 }]]); // Mock para la consulta del taller (debe existir)
      mockQueryResponse([[{ id: 1 }]]); // Mock para la consulta del tipo de mantención (debe existir)
      mockQueryResponse([]); // Mock para la validación de la existencia de una mantención (debe no existir)
      mockQueryResponse([]); // Mock para la validación de la existencia de carga de combustible (debe no existir)
    
      const nuevaMantencion = {
        bitacora_id: 1,
        maquina_id: 1,
        taller_id: 1,
        tipo_mantencion_id: 1,
        fec_inicio: "01-01-2024",
        fec_termino: "02-01-2024",
        ord_trabajo: "OT-123",
        cost_ser: 1000
      };
    
      const response = await request(app)
        .post("/api/mantencion/old")
        .set("Authorization", `Bearer ${token}`)
        .send(nuevaMantencion);
    
      console.log(response.body);
      expect(response.status).toBe(200);  // Esperamos que la respuesta sea 200, indicando que la mantención fue creada con éxito
      expect(response.body).toHaveProperty('message', "Mantención creada exitosamente");
    });
    
  });

  describe("POST /api/mantencion/periodica", () => {
    it("debe crear una nueva mantención", async () => {
      // Mock de las consultas a la base de datos
      mockQueryResponse([[{ id: 1 }]]); // Mock para la bitácora
      mockQueryResponse([[{ compania_id: 1 }]]); // Mock para la consulta de la compañía en la bitácora
      mockQueryResponse([]); // Mock para la validación de la existencia de una mantención (debe no existir)
      mockQueryResponse([]); // Mock para la validación de la existencia de carga de combustible (debe no existir)
    
      const nuevaMantencion = {
        bitacora_id: 1,
        maquina_id: 1,
        taller_id: 1,
        tipo_mantencion_id: 1,
        fec_inicio: "01-01-2024",
        fec_termino: "02-01-2024",
        ord_trabajo: "OT-123",
        cost_ser: 1000
      };
    
      const response = await request(app)
        .post("/api/mantencion/old")
        .set("Authorization", `Bearer ${token}`)
        .send(nuevaMantencion);
    
      console.log(response.body);
      expect(response.status).toBe(200);  // Esperamos que la respuesta sea 200, indicando que la mantención fue creada con éxito
      expect(response.body).toHaveProperty('message', "Mantención creada exitosamente");
    });
  });

  describe("PATCH /api/mantencion/:id/aprobacion", () => {
    it("debe aprobar una mantención", async () => {
      mockQueryResponse([[{ aprobada: 0 }]]);
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .patch("/api/mantencion/1/aprobacion")
        .set("Authorization", `Bearer ${token}`)
        .send({ usuario_id: 1 });

        console.log(response.body)
      expect(response.status).toBe(200);
      expect(response.body.aprobada).toBe(1);
    });
  });

  describe("PATCH /api/mantencion/:id/status", () => {
    it("debe actualizar el estado de una mantención", async () => {
      mockQueryResponse([[{ id: 1 }]]); // Verificación del estado
      mockQueryResponse([{ affectedRows: 1 }]); // Actualización

      const response = await request(app)
        .patch("/api/mantencion/1/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ estado_mantencion_id: 2 });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Estado de mantención actualizado correctamente");
    });
  });

  describe("GET /api/mantencion/excel", () => {
    it("debe descargar el archivo Excel con los filtros especificados", async () => {
      const mockData = [{
        id: 1,
        patente: "ABC123",
        fec_inicio: "01-01-2024"
      }];
      mockQueryResponse([mockData]);

      const response = await request(app)
        .get("/api/mantencion/excel?fields=id,patente,fec_inicio&taller=TallerTest")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  });

  describe("DELETE /api/mantencion/:id", () => {
    it("debe eliminar (soft delete) una mantención", async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete("/api/mantencion/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });
  });
});