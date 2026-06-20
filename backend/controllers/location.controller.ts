import { Request, Response } from "express";
import { LocationService } from "../services/LocationService";

export const logLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await LocationService.logLocation(req.body);
    res.status(201).json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getHistory = async (req: Request, res: Response): Promise<void> => {
  const { journeyId } = req.params;
  const { limit } = req.query;
  try {
    const history = await LocationService.getHistory(
      journeyId,
      limit ? parseInt(limit as string) : 50
    );
    res.status(200).json({ success: true, history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
