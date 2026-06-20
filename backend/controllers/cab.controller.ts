import { Request, Response } from "express";
import { CabService } from "../services/CabService";

export const registerCabTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const trip = await CabService.registerCabTrip(req.body);
    res.status(201).json({ success: true, trip });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getCabDetails = async (req: Request, res: Response): Promise<void> => {
  const { journeyId } = req.params;
  try {
    const trip = await CabService.getCabTrip(journeyId);
    if (!trip) {
      res.status(404).json({ success: false, message: "Cab trip details not found" });
      return;
    }
    res.status(200).json({ success: true, trip });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const toggleCabMonitoring = async (req: Request, res: Response): Promise<void> => {
  const { journeyId } = req.params;
  const { enabled } = req.body;
  try {
    const trip = await CabService.toggleMonitoring(journeyId, enabled);
    if (!trip) {
      res.status(404).json({ success: false, message: "Cab trip details not found" });
      return;
    }
    res.status(200).json({ success: true, trip });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
