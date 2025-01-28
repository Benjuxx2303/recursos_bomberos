import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY } from "../config.js"; // Asegúrate de importar tu clave secreta

// Middleware para verificar el rol del usuario
export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(403).json({ message: "No se proporcionó token de autenticación" });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(403).json({ message: "Token no válido" });
        }

        try {
            const decoded = jwt.verify(token, SECRET_JWT_KEY);
            const { rol_personal } = decoded;

            if (!allowedRoles.includes(rol_personal)) {
                return res.status(403).json({ message: "No tienes permisos para acceder a esta ruta" });
            }

            req.user = decoded; // Guarda la información del usuario en la petición

            next();
        } catch (error) {
            return res.status(401).json({ message: "Token no válido o expirado" });
        }
    };
};

// Middleware para verificar permisos específicos
export const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        try {
            const decoded = jwt.verify(token, SECRET_JWT_KEY);
            
            // Si el rol del usuario es "admin", se permite el acceso sin necesidad de comprobar permisos
            if (decoded.rol_personal === 'TELECOM') {
                return next(); // El admin tiene acceso automático, continuar
            }

            // Verificar si el usuario tiene el permiso requerido
            const hasPermission = decoded.permisos.some(permission => permission.nombre === requiredPermission);

            if (!hasPermission) {
                return res.status(403).json({ error: 'Permiso insuficiente' });
            }

            req.user = decoded; // Guarda la información del usuario en la petición
            next(); // Permiso válido, continuar
        } catch (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
    };
};


// Función para refrescar el token de acceso
export const refreshAccessToken = (req, res) => {
    const refreshToken = req.headers.authorization?.split(' ')[1];

    if (!refreshToken) {
        return res.status(403).json({ error: 'No se proporcionó token de refresco' });
    }

    try {
        const decoded = jwt.verify(refreshToken, SECRET_JWT_KEY);
        const newAccessToken = jwt.sign(
            { id: decoded.id, rol_personal: decoded.rol_personal, permisos: decoded.permisos },
            SECRET_JWT_KEY,
            { expiresIn: '15m' } // El nuevo token de acceso expira en 15 minutos
        );

        return res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
        return res.status(403).json({ error: 'Token de refresco inválido o expirado' });
    }
};