import jwt from 'jsonwebtoken';
import { SECRET_JWT_KEY } from '../config.js';

// Roles que pueden ver todas las compañías
const ROLES_SIN_FILTRO = ['TELECOM', 'Comandante', 'Inspector Material Mayor'];

const ROLES_RESTRINGIDOS = ['Conductor','Maquinista'];

export const filterByCompany = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(403).json({ error: 'Token no proporcionado' });
        }

        // Decodificar el token
        const decoded = jwt.verify(token, SECRET_JWT_KEY);
        const { rol_personal, compania_id, personal_id } = decoded;

        // Si el rol está en la lista de roles sin filtro, no aplicamos filtro
        if (ROLES_SIN_FILTRO.includes(rol_personal)) {
            req.companyFilter = null; // No aplicar filtro
            req.personalFilter = null;
        } else if (ROLES_RESTRINGIDOS.includes(rol_personal)) {
            // Para roles restringidos, establecer filtro por personal_id y compania_id
            req.companyFilter = compania_id;
            req.personalFilter = personal_id;
        } else {
            // Para otros roles, establecer el filtro solo por compañía
            req.companyFilter = compania_id;
            req.personalFilter = null;
        }
        console.log('Company Filter:', req.companyFilter);
        console.log('Personal Filter:', req.personalFilter);
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        next(error);
    }
}; 