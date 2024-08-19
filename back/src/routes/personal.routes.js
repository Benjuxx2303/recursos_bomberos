import { Router } from "express";
import {
    getPersonal,
    getPersonalbyID,
    createPersonal,
    downPersonal,
    updatePersonal,
} from "../controllers/personal.controllers.js"

const router = Router();

router.get("/personal", getPersonal);

router.get("/personal/:id", getPersonalbyID);

router.post("/personal", createPersonal);

// TODO: Ver como solucionar el problema de estos dos

// dar de baja
router.put("/personal/:id", downPersonal);

// actualizar
router.put("/personal/:id", updatePersonal);

export default router;