import {Router} from "express";

import { getIndex } from "../controllers/index.controllers.js";

const router = Router();

router.get("/ping", getIndex)

export default router;