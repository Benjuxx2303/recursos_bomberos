import request from 'supertest';
import app from '../app'; // Asegúrate de importar tu aplicación Express
import { pool } from '../db.js';
import { TOKEN_TEST } from '../config.js';

jest.mock('../db.js', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const token = TOKEN_TEST; // Asigna el valor del token aquí

// Función reutilizable para manejar las respuestas de las consultas
const mockQueryResponse = (response) => pool.query.mockResolvedValue(response);
const mockQueryError = (error) => pool.query.mockRejectedValue(error);

describe('Estado de Mantención Controller', () => {

  // Test para obtener los estados de mantención (paginado)
  describe('GET /api/estado_mantencion', () => {
    it('debe devolver la lista de estados de mantención (paginado)', async () => {
      const mockData = [
        { id: 1, nombre: 'Activo', descripcion: 'Estado activo' },
        { id: 2, nombre: 'Inactivo', descripcion: 'Estado inactivo' },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get('/api/estado_mantencion?page=1&pageSize=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it('debe devolver un error 500 si ocurre un error en la base de datos', async () => {
      mockQueryError(new Error('Database error'));

      const response = await request(app)
        .get('/api/estado_mantencion')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error interno del servidor');
    });
  });

  // Test para obtener un estado de mantención por ID
  describe('GET /api/estado_mantencion/:id', () => {
    it('debe devolver el estado de mantención solicitado', async () => {
      const mockEstado = { id: 1, nombre: 'Activo', descripcion: 'Estado activo' };

      mockQueryResponse([[mockEstado]]);

      const response = await request(app)
        .get('/api/estado_mantencion/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEstado);
    });

    it('debe devolver 404 si el estado de mantención no se encuentra', async () => {
      mockQueryResponse([[]]); // No se encuentra el estado

      const response = await request(app)
        .get('/api/estado_mantencion/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Estado de mantención no encontrado');
    });
  });

  // Test para crear un estado de mantención
  describe('POST /api/estado_mantencion', () => {
    it('debe crear un nuevo estado de mantención', async () => {
      const newEstado = { nombre: 'En Mantenimiento', descripcion: 'Estado en mantenimiento' };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/estado_mantencion')
        .set('Authorization', `Bearer ${token}`)
        .send(newEstado);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newEstado.nombre);
    });

    it('debe devolver un error 400 si los datos son inválidos', async () => {
      const invalidEstado = { nombre: '', descripcion: '' }; // Datos inválidos

      const response = await request(app)
        .post('/api/estado_mantencion')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidEstado);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("Tipo de dato inválido para 'nombre'");
    });
  });

  // Test para eliminar un estado de mantención
  describe('DELETE /api/estado_mantencion/:id', () => {
    it('debe eliminar el estado de mantención correctamente', async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete('/api/estado_mantencion/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it('debe devolver un error 404 si no se encuentra el estado', async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete('/api/estado_mantencion/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Estado de mantención no encontrado');
    });
  });

  // Test para actualizar un estado de mantención
  describe('PATCH /api/estado_mantencion/:id', () => {
    it('debe actualizar el estado de mantención correctamente', async () => {
      const updatedEstado = { nombre: 'Mantenimiento', descripcion: 'Estado de mantenimiento actualizado' };

      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .patch('/api/estado_mantencion/1')
        .set('Authorization', `Bearer ${token}`)
        .send(updatedEstado);

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedEstado.nombre);
    });

    it('debe devolver un error 404 si el estado no existe', async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch('/api/estado_mantencion/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Estado No Existe' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Estado de mantención no encontrado');
    });
  });

});
