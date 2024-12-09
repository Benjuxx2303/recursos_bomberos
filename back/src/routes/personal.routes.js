import { Router } from "express";
import multer from 'multer';
import { checkRole } from "../controllers/authMiddleware.js";
import {
    createPersonal,
    downPersonal,
    // getPersonalWithDetails,
    getPersonalWithDetailsPage,
    getPersonalbyID,
    updateImage,
    updatePersonal,
} from "../controllers/personal.controllers.js";

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Permitir solo imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'));
        }
    }
});

// TODO: Resto de rutas: busqueda con LIKE (sql)

const router = Router();
const base_route = '/personal';

// router.get(base_route, getPersonalWithDetails);
router.get(base_route, checkRole(['TELECOM']), getPersonalWithDetailsPage); // con paginación
// http://{url}/api/personal
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getPersonalbyID);

// Ruta para crear personal con manejo de errores de Multer
router.post(base_route, checkRole(['TELECOM']), (req, res, next) => {
    upload.fields([
        { name: 'imagen', maxCount: 1 },
        { name: 'licencia_imagen', maxCount: 1 }
    ])(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Error de Multer
            return res.status(400).json({
                message: "Error al subir el archivo",
                error: err.message
            });
        } else if (err) {
            // Otro tipo de error   
            return res.status(400).json({
                message: "Error al procesar el archivo",
                error: err.message
            });
        }
        // Si no hay error, continuar con el controlador
        next();
    });
}, createPersonal);

// Dar de baja (marcar como inactivo)
router.delete(`${base_route}/:id`, checkRole(['TELECOM']), downPersonal);

// Actualizar personal
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updatePersonal);

// Nueva ruta para actualizar la imagen
router.patch(`${base_route}/:id/image`, checkRole(['TELECOM']), upload.single('file'), updateImage); // Ruta para actualizar la imagen

export default router;