import { Request, Response } from "express";
import { GuardianService } from "../services/GuardianService";

export const registerGuardian = async (req: Request, res: Response): Promise<void> => {
  try {
    const guardian = await GuardianService.registerGuardian(req.body);
    res.status(201).json({ success: true, guardian });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { status } = req.body;
  try {
    const guardian = await GuardianService.setGuardianStatus(userId, status);
    if (!guardian) {
      res.status(404).json({ success: false, message: "Guardian not found" });
      return;
    }
    res.status(200).json({ success: true, guardian });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
