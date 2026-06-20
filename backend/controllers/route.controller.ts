import { Request, Response } from "express";
import { JourneyService } from "../services/JourneyService";

export const getRoutes = async (req: Request, res: Response): Promise<void> => {
  const { startLat, startLng, endLat, endLng } = req.query;
  if (!startLat || !startLng || !endLat || !endLng) {
    res.status(400).json({ success: false, message: "Missing coordinates parameters" });
    return;
  }
  try {
    const start = { lat: parseFloat(startLat as string), lng: parseFloat(startLng as string) };
    const end = { lat: parseFloat(endLat as string), lng: parseFloat(endLng as string) };
    const routes = await JourneyService.getSafeRoutes(start, end);
    res.status(200).json({ success: true, routes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
