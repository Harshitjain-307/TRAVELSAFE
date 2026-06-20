import { Router } from "express";
import { triggerEmergency, acceptMission, updateStatus, resolveEmergency } from "../controllers/emergency.controller";

const router = Router();

router.post("/trigger", triggerEmergency);
router.post("/:emergencyId/accept", acceptMission);
router.put("/:emergencyId/responder", updateStatus);
router.post("/:emergencyId/resolve", resolveEmergency);

export default router;
