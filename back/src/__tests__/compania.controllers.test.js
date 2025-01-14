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

describe('Compania Controller', () => {
  // Tests para obtener compañías con paginación
  describe('GET /api/compania', () => {
    it('debe devolver la lista de compañías con paginación', async () => {
      const mockData = [
        { id: 1, nombre: 'Compania 1', direccion: 'Dirección 1', img_url: null, isDeleted: 0 },
        { id: 2, nombre: 'Compania 2', direccion: 'Dirección 2', img_url: null, isDeleted: 0 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get('/api/compania?page=1&pageSize=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it('debe devolver todos los registros si no se proporciona "page"', async () => {
      const mockData = [
        { id: 1, nombre: 'Compania 1', direccion: 'Dirección 1', img_url: null, isDeleted: 0 },
        { id: 2, nombre: 'Compania 2', direccion: 'Dirección 2', img_url: null, isDeleted: 0 },
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get('/api/compania')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it('debe devolver un error 500 si ocurre un error en la base de datos', async () => {
      mockQueryError(new Error('Database error'));

      const response = await request(app)
        .get('/api/compania')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error interno del servidor');
    });
  });

  // Tests para obtener una compañía por ID
  describe('GET /api/compania/:id', () => {
    it('debe devolver la compañía solicitada', async () => {
      const mockCompania = { id: 1, nombre: 'Compania 1', direccion: 'Dirección 1', img_url: null, isDeleted: 0 };

      mockQueryResponse([[mockCompania]]);

      const response = await request(app)
        .get('/api/compania/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCompania);
    });

    it('debe devolver 404 si la compañía no se encuentra', async () => {
      mockQueryResponse([[]]); // No se encuentra la compañía

      const response = await request(app)
        .get('/api/compania/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Compañía no encontrada');
    });
  });

  // Tests para crear una nueva compañía
  describe('POST /api/compania', () => {
    it('debe crear una nueva compañía', async () => {
      const newCompania = { nombre: 'Compania Nueva', direccion: 'Nueva Dirección' };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/compania')
        .set('Authorization', `Bearer ${token}`)
        .send(newCompania);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newCompania.nombre);
    });

    it('debe devolver un error 400 si los datos son inválidos', async () => {
      const invalidData = { nombre: '', direccion: '' };

      const response = await request(app)
        .post('/api/compania')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("Tipo de datos inválido para 'nombre'");
    });
  });

  // Tests para eliminar una compañía
  describe('DELETE /api/compania/:id', () => {
    it('debe eliminar la compañía correctamente', async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete('/api/compania/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it('debe devolver un error 404 si la compañía no se encuentra', async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete('/api/compania/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Compañía no encontrada');
    });
  });

  // Tests para actualizar una compañía
  describe('PATCH /api/compania/:id', () => {
    it('debe actualizar la compañía correctamente', async () => {
      const updatedData = { nombre: 'Compania Actualizada', direccion: 'Dirección Actualizada' };

      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .patch('/api/compania/1')
        .set('Authorization', `Bearer ${token}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe(updatedData.nombre);
    });

    it('debe devolver un error 404 si la compañía no existe', async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .patch('/api/compania/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'No Existe' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Compañía no encontrada');
    });
  });
});
