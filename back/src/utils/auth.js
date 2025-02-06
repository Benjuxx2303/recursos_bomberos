import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export const verifyToken = async (token) => {
    try {
        console.log('Verificando token:', token.substring(0, 20) + '...');
        const decoded = jwt.verify(token, process.env.SECRET_JWT_KEY);
        /* console.log('Token decodificado:', decoded); */
        
        if (!decoded || !decoded.userId) {
            console.log('Token inválido: falta userId');
            return null;
        }

        // Verificar si el token ha expirado
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
            console.log('Token expirado');
            return null;
        }

        // Obtener información del usuario desde la base de datos
        const [rows] = await pool.query(
            'SELECT id, username, personal_id FROM usuario WHERE id = ? AND isDeleted = 0',
            [decoded.userId]
        );

        if (!rows[0]) {
            throw new Error('Usuario no encontrado');
        }

        return rows[0];
    } catch (error) {
        console.error('Error al verificar token:', error.message);
        return null;
    }
};  