import { Router } from "express";
import {
    getRolPersonal,
    getRolesPersonal,
    createRolPersonal,
    deleteRolPersonal,
    updateRolPersonal,
} from "../controllers/rol_personal.controllers.js"

const router = Router();

router.get("/rol_personal", getRolesPersonal);

router.get("/rol_personal/:id", getRolPersonal);

router.post("/rol_personal", createRolPersonal);

router.delete("/rol_personal/:id", deleteRolPersonal);

router.put("/rol_personal", updateRolPersonal);

export default router;