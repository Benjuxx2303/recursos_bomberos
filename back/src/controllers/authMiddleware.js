import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY } from "../config.js"; // Asegúrate de importar tu clave secreta


// authMiddleware.js
//usar el token desde el encabezado Authorization:
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

// añadir "checkAuth"
// añadir "refreshAccessToken"
