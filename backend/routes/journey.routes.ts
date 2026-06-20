import { Router } from "express";
import { startJourney, updateJourneyLocation, completeJourney } from "../controllers/journey.controller";

const router = Router();

router.post("/start", startJourney);
router.put("/:journeyId/location", updateJourneyLocation);
router.post("/:journeyId/complete", completeJourney);

export default router;
