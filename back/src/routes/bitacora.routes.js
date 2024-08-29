import { Router } from "express";
import {
  getBitacora,
  getBitacoraById,
  createBitacora,
  deleteBitacora,
  updateBitacora,
} from "../controllers/bitacora.controllers.js";

// TODO: me apoyé de gpt para ver que tal el codigo y me salió esto xd.

const router = Router();

const base_route = "/bitacora";

router.get(base_route, getBitacora);
router.get(
  `${base_route}/:id/:compania_id/:conductor_id/:clave_id`,
  getBitacoraById
);

router.post(base_route, createBitacora);

router.delete(
  `${base_route}/:id/:compania_id/:conductor_id/:clave_id`,
  deleteBitacora
);


router.patch(
  `${base_route}/:id/:compania_id/:conductor_id/:clave_id`,
  updateBitacora
);

export default router;
