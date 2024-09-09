import { Router } from "express";
import {
  getMantencioneswithDetails,
  getMantencionById,
  createMantencion,
  deleteMantencion,
  updateMantencion,
} from "../controllers/mantencion.controllers.js";

const router = Router();

const base_route = "/mantencion"; 

router.get(base_route, getMantencioneswithDetails);
router.get(`${base_route}/:id`, getMantencionById);

router.post(base_route, createMantencion);

router.delete(`${base_route}/:id`, deleteMantencion);

router.patch(`${base_route}/:id`, updateMantencion);

export default router;