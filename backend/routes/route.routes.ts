import { Router } from "express";
import { getRoutes } from "../controllers/route.controller";

const router = Router();

router.get("/calculate", getRoutes);

export default router;
