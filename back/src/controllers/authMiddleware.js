import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY } from "../config.js"; // Asegúrate de importar tu clave secreta

// Middleware para verificar roles
export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        const token = req.cookies.access_token;

        if (!token) {
            return res.status(403).json({ message: "No se proporcionó token de autenticación" });
        }

        try {
            // Verificar el JWT
            const decoded = jwt.verify(token, SECRET_JWT_KEY);

            // Obtener el rol del usuario desde el payload del JWT
            const { rol_personal } = decoded;

            // Verificar si el rol del usuario está permitido
            if (!allowedRoles.includes(rol_personal)) {
                return res.status(403).json({ message: "No tienes permisos para acceder a esta ruta" });
            }

            // Si tiene el rol adecuado, pasar al siguiente middleware
            next();
        } catch (error) {
            return res.status(401).json({ message: "Token no válido o expirado" });
        }
    };
};

// añadir "checkAuth"
// añadir "refreshAccessToken"
