import { Router } from "express";
import multer from 'multer';
import { checkPermission } from "../controllers/authMiddleware.js";
import {
  aprobarMantencion,
  completarMantencion,
  createMantencion,
  createMantencionPeriodica,
  deleteMantencion,
  downloadExcel,
  enProceso,
  enviarAEvaluacion,
  getMantencionAllDetailsById,
  getMantencionesAllDetailsSearch,
  rechazarMantencion,
  updateMaintenanceStatus,
  updateMantencion
} from "../controllers/mantencion.controllers.js";
import { getMantencionCostosByAnio, getReporteGeneral, getReporteMantencionesEstadoCosto } from "../controllers/stats_mantencion.js";

// Configuración de multers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuración de multer para los campos o "key" de imagen
const uploadFields = upload.fields([
  { name: 'imagen' }
]);

const router = Router();

const base_route = "/mantencion"; 

router.get(`${base_route}/excel`, checkPermission('verMantenciones'), downloadExcel);
// http://{url}/api/mantencion
// QueryParams:
// fields:           id,bitacora.id,bitacora.compania,bitacora.conductor,bitacora.direccion,bitacora.fh_salida,bitacora.fh_llegada,bitacora.km_salida,bitacora.km_llegada,bitacora.hmetro_salida,bitacora.hmetro_llegada,bitacora.hbomba_salida,bitacora.hbomba_llegada,bitacora.obs,patente,fec_inicio,fec_termino,ord_trabajo,n_factura,img_url 

// taller:            test
// estado_mantencion: rechazada
// ord_trabajo:       OT-12345
// compania:          compañia 1

router.get(base_route,  getMantencionesAllDetailsSearch);
// http://{url}/api/mantencion
// QueryParams:
// page:              1
// pageSize:          10

// taller:            test
// estado_mantencion: rechazada
// ord_trabajo:       OT-12345
// compania:          compañia 1

router.get(`${base_route}/:id`, checkPermission('verMantencion'), getMantencionAllDetailsById);

/* router.post(base_route, checkPermission('ingresarMantencion'), createMantencionBitacora); */
router.post(`${base_route}/old`, checkPermission('ingresarMantencion'), uploadFields,createMantencion);
router.delete(`${base_route}/:id`, checkPermission('eliminarMantencion'), deleteMantencion);
router.patch(`${base_route}/:id`, checkPermission('actualizarMantencion'), uploadFields, updateMantencion);

//mantencion en proceso
router.patch(`${base_route}/:id/en-proceso`, checkPermission('dejarMaquina'), enProceso);

//mantencion completada
router.patch(`${base_route}/:id/completar`, checkPermission('retirarMaquina'), completarMantencion);

// Nueva ruta para aprobar/rechazar mantenciones
router.patch(`${base_route}/:id/aprobacion`, checkPermission('aprobarMantencion'), aprobarMantencion);

// Nueva ruta para rechazar mantenciones
router.patch(`${base_route}/:id/rechazar`, checkPermission('rechazarMantencion'), rechazarMantencion);
// Nueva ruta para enviar a evaluacion
router.patch(`${base_route}/:id/evaluacion`, checkPermission('enviarAEvaluacion'), enviarAEvaluacion);

router.patch(`${base_route}/:id/status`, checkPermission('actualizarMantencion'), updateMaintenanceStatus);

// Nueva ruta para crear mantenciones periódicas
router.post(`${base_route}/periodica`, checkPermission('createMantencionPeriodica'), createMantencionPeriodica);

// ---- reportes
router.get(`/reportes${base_route}/costos`, checkPermission('verMantenciones'), getMantencionCostosByAnio)
// ej: {url}/api/reportes/mantencion/costos
// QueryParams:
// year:   2024

router.get(`/reportes${base_route}/stats`, checkPermission('verMantenciones'), getReporteMantencionesEstadoCosto);
// http://{url}/api/reportes/mantencion/datosMantencion
// QueryParams:
// startDate:   01-01-2024
// endDate:     01-01-2025
// companiaId:  2

router.get(`/reportes${base_route}/dashboard`, checkPermission('verMantenciones'), getReporteGeneral);
// http://{url}/api/reportes/mantencion/dashboard

// Nueva ruta para descargar el archivo Excel de mantenciones

export default router;