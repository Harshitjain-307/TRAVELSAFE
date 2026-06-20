import { Request, Response } from "express";
import { EmergencyService } from "../services/EmergencyService";
import { SocketService } from "../services/SocketService";

export const triggerEmergency = async (req: Request, res: Response): Promise<void> => {
  try {
    const emergency = await EmergencyService.triggerEmergency(req.body);
    // Broadcast emergency over WebSocket to all portals
    SocketService.broadcastEmergencyAlert(emergency);
    res.status(201).json({ success: true, emergency });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const acceptMission = async (req: Request, res: Response): Promise<void> => {
  const { emergencyId } = req.params;
  const { responderId, type } = req.body; // type is guardian or police
  try {
    const emergency = await EmergencyService.assignResponder(emergencyId, responderId, type);
    if (!emergency) {
      res.status(404).json({ success: false, message: "Emergency incident not found" });
      return;
    }
    res.status(200).json({ success: true, emergency });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  const { emergencyId } = req.params;
  const { responderId, status } = req.body;
  try {
    const emergency = await EmergencyService.updateResponderStatus(emergencyId, responderId, status);
    if (!emergency) {
      res.status(404).json({ success: false, message: "Emergency incident not found" });
      return;
    }
    res.status(200).json({ success: true, emergency });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const resolveEmergency = async (req: Request, res: Response): Promise<void> => {
  const { emergencyId } = req.params;
  try {
    const emergency = await EmergencyService.resolveEmergency(emergencyId);
    if (!emergency) {
      res.status(404).json({ success: false, message: "Emergency incident not found" });
      return;
    }
    SocketService.broadcastEmergencyResolution(emergencyId, "Incident resolved, victim safe.");
    res.status(200).json({ success: true, emergency });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
