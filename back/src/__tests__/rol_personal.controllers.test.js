import request from 'supertest';
import { app } from "../app";
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

describe('Rol Personal Controller', () => {

  // Test para obtener todos los roles de personal (paginado)
  describe('GET /api/rol_personal', () => {
    it('debe devolver la lista de roles de personal', async () => {
      const mockData = [
        { id: 1, nombre: 'Administrador', descripcion: 'Admin role' },
        { id: 2, nombre: 'Supervisor', descripcion: 'Supervisor role' }
      ];

      mockQueryResponse([mockData]);

      const response = await request(app)
        .get('/api/rol_personal?page=1&pageSize=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it('debe devolver un error 500 si ocurre un error en la base de datos', async () => {
      mockQueryError(new Error('Database error'));

      const response = await request(app)
        .get('/api/rol_personal')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error interno del servidor');
    });
  });

  // Test para obtener un rol personal por ID
  describe('GET /api/rol_personal/:id', () => {
    it('debe devolver el rol personal solicitado', async () => {
      const mockRol = { id: 1, nombre: 'Administrador', descripcion: 'Admin role' };

      mockQueryResponse([[mockRol]]);

      const response = await request(app)
        .get('/api/rol_personal/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRol);
    });

    it('debe devolver 404 si el rol personal no se encuentra', async () => {
      mockQueryResponse([[]]);

      const response = await request(app)
        .get('/api/rol_personal/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('rol_personal no encontrado');
    });
  });

  // Test para crear un rol personal
  describe('POST /api/rol_personal', () => {
    it('debe crear un nuevo rol personal', async () => {
      const newRol = { nombre: 'Nuevo Rol', descripcion: 'Descripción del nuevo rol' };

      mockQueryResponse([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/rol_personal')
        .set('Authorization', `Bearer ${token}`)
        .send(newRol);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
      expect(response.body.nombre).toBe(newRol.nombre);
    });

    it('debe devolver un error 400 si los datos son inválidos', async () => {
      const invalidRol = { nombre: '', descripcion: '' };
    
      const response = await request(app)
        .post('/api/rol_personal')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidRol);
    
      // Verificar que el código de estado es 400 (Bad Request)
      expect(response.status).toBe(400);
    
      // Verificar que el cuerpo de la respuesta contiene los errores esperados
      expect(response.body.errors).toContain("Tipo de datos inválido para 'nombre'");
      expect(response.body.errors).toContain("Tipo de datos inválido para 'descripcion'");
    });
  });

  // Test para eliminar un rol personal
  describe('DELETE /api/rol_personal/:id', () => {
    it('debe eliminar el rol personal correctamente', async () => {
      mockQueryResponse([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete('/api/rol_personal/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it('debe devolver un error 404 si no se encuentra el rol', async () => {
      mockQueryResponse([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete('/api/rol_personal/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('rol_personal no encontrado');
    });
  });

  // Test para actualizar un rol personal
  describe('PATCH /api/rol_personal/:id', () => {
    it('debe actualizar el rol personal correctamente', async () => {
        const updatedRol = { nombre: 'Rol Actualizado', descripcion: 'Descripción actualizada', isDeleted: 0 };

        // Simulamos que no existe un rol con el mismo nombre (el nombre 'Rol Actualizado' no debe existir en la base de datos)
        mockQueryResponse([[ /* Simula que no existe un rol con ese nombre */ ]]);  // Respuesta vacía, lo que significa que el nombre no está duplicado

        // Simulamos la respuesta para la actualización en la base de datos
        mockQueryResponse([{ affectedRows: 1 }]); // Simula que la actualización afecta una fila

        // Simulamos la respuesta de la consulta posterior para obtener el rol actualizado
        mockQueryResponse([[{ id: 1, nombre: updatedRol.nombre, descripcion: updatedRol.descripcion, isDeleted: updatedRol.isDeleted }]]);

        const response = await request(app)
            .patch('/api/rol_personal/1')
            .set('Authorization', `Bearer ${token}`)
            .send(updatedRol);

        // Asegúrate de que la respuesta sea exitosa
        expect(response.status).toBe(200);
        expect(response.body.nombre).toBe(updatedRol.nombre);
        expect(response.body.descripcion).toBe(updatedRol.descripcion);
        expect(response.body.isDeleted).toBe(updatedRol.isDeleted);
    });

    it('debe devolver un error 404 si el rol no existe', async () => {
        // Simulamos que no se encontró el rol al intentar actualizarlo
        mockQueryResponse([{ affectedRows: 0 }]);  // No se ha afectado ninguna fila

        const response = await request(app)
            .patch('/api/rol_personal/999')  // ID del rol que no existe
            .set('Authorization', `Bearer ${token}`)
            .send({ nombre: 'Rol No Existe' });

        // Aseguramos que el código de respuesta sea 404, indicando que no se encontró el rol
        expect(response.status).toBe(404);

        // Verificamos que el mensaje de error sea el esperado
        expect(response.body.message).toBe('rol_personal no encontrado');
    });
});
});