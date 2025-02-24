import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY } from "../config.js"; // Asegúrate de importar tu clave secreta
import { pool } from "../db.js";

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
    return async (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            console.log('Acceso denegado: Token no proporcionado');
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        try {
            const decoded = jwt.verify(token, SECRET_JWT_KEY);
            
            // Si el rol del usuario es "TELECOM", se permite el acceso sin necesidad de comprobar permisos
            if (decoded.rol_personal === 'TELECOM') {
                console.log('Acceso permitido: Rol TELECOM');
                return next();
            }

            try {
                // Obtener los permisos del rol desde la base de datos usando la misma consulta que getPermisosByRol
                const [permisos] = await pool.query(`
                    SELECT p.*, c.nombre as categoria_nombre 
                    FROM permiso p
                    LEFT JOIN categoria c ON p.categoria_id = c.id
                    INNER JOIN rol_permisos rp ON p.id = rp.permiso_id
                    WHERE rp.rol_personal_id = ? 
                    AND (p.isDeleted IS NULL OR p.isDeleted = false)
                    AND (rp.isDeleted IS NULL OR rp.isDeleted = false)
                `, [decoded.rol_personal_id]);

                // Verificar si el usuario tiene el permiso requerido
                const hasPermission = permisos.some(permiso => 
                    permiso.nombre === requiredPermission
                );

                if (!hasPermission) {
                    console.log(`Acceso denegado: Permiso insuficiente para ${requiredPermission}`);
                    return res.status(403).json({ error: 'Permiso insuficiente' });
                }

                console.log(`Acceso permitido: Permiso ${requiredPermission} válido`);
                req.user = decoded; // Guarda la información del usuario en la petición
                next(); // Permiso válido, continuar
            } catch (dbError) {
                console.error('Error al verificar permisos:', dbError);
                return res.status(500).json({ error: 'Error al verificar permisos' });
            }
        } catch (jwtError) {
            console.log('Acceso denegado: Token inválido');
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
            { id: decoded.id, rol_personal: decoded.rol_personal },
            SECRET_JWT_KEY,
            { expiresIn: '15m' } // El nuevo token de acceso expira en 15 minutos
        );

        return res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
        return res.status(403).json({ error: 'Token de refresco inválido o expirado' });
    }
};