import { Router } from "express";
import {
    getCompanias,
    getCompania,
    createCompania,
    deleteCompania,
    updateCompania,
} from "../controllers/compania.controllers.js"

const router = Router();

router.get("/compania", getCompanias);

router.get("/compania/:id", getCompania);

router.post("/compania", createCompania);

router.delete("/compania/:id", deleteCompania);

router.put("/compania/:id", updateCompania);

export default router;