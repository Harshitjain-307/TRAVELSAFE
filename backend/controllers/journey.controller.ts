import { Request, Response } from "express";
import { JourneyService } from "../services/JourneyService";

export const startJourney = async (req: Request, res: Response): Promise<void> => {
  try {
    const journey = await JourneyService.createJourney(req.body);
    res.status(201).json({ success: true, journey });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateJourneyLocation = async (req: Request, res: Response): Promise<void> => {
  const { journeyId } = req.params;
  const { lat, lng, routeProgress } = req.body;
  try {
    await JourneyService.updateLocation(journeyId, lat, lng, routeProgress);
    res.status(200).json({ success: true, message: "Location updated successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const completeJourney = async (req: Request, res: Response): Promise<void> => {
  const { journeyId } = req.params;
  try {
    const journey = await JourneyService.endJourney(journeyId, "COMPLETED");
    if (!journey) {
      res.status(404).json({ success: false, message: "Journey not found" });
      return;
    }
    res.status(200).json({ success: true, journey });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
