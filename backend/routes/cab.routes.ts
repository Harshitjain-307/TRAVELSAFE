import { Router } from "express";
import { registerCabTrip, getCabDetails, toggleCabMonitoring } from "../controllers/cab.controller";

const router = Router();

router.post("/register", registerCabTrip);
router.get("/:journeyId", getCabDetails);
router.put("/:journeyId/monitoring", toggleCabMonitoring);

export default router;
