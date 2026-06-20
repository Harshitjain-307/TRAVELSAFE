import { Router } from "express";
import { registerGuardian, updateStatus } from "../controllers/guardian.controller";

const router = Router();

router.post("/register", registerGuardian);
router.put("/:userId/status", updateStatus);

export default router;
