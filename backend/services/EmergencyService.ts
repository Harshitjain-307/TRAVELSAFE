import { Emergency, IEmergency } from "../models/Emergency";
import { GuardianService } from "./GuardianService";

export class EmergencyService {
  static async triggerEmergency(data: any): Promise<IEmergency> {
    const emergency = new Emergency({
      ...data,
      status: "ACTIVE",
      startedAt: new Date()
    });
    await emergency.save();
    return emergency;
  }

  static async assignResponder(emergencyId: string, responderId: string, type: "guardian" | "police"): Promise<IEmergency | null> {
    const emergency = await Emergency.findById(emergencyId);
    if (emergency) {
      emergency.responders.push({
        id: responderId,
        type,
        status: "responding"
      });
      await emergency.save();
      
      if (type === "guardian") {
        await GuardianService.setGuardianStatus(responderId, "responding");
      }
      return emergency;
    }
    return null;
  }

  static async updateResponderStatus(emergencyId: string, responderId: string, status: "responding" | "arrived"): Promise<IEmergency | null> {
    const emergency = await Emergency.findById(emergencyId);
    if (emergency) {
      const idx = emergency.responders.findIndex(r => r.id === responderId);
      if (idx >= 0) {
        emergency.responders[idx].status = status;
        await emergency.save();
      }
      if (status === "arrived") {
        await GuardianService.setGuardianStatus(responderId, "arrived");
      }
      return emergency;
    }
    return null;
  }

  static async resolveEmergency(emergencyId: string): Promise<IEmergency | null> {
    const emergency = await Emergency.findById(emergencyId);
    if (emergency) {
      emergency.status = "RESOLVED";
      emergency.resolvedAt = new Date();
      await emergency.save();

      // Reset responders back to standby
      for (const responder of emergency.responders) {
        if (responder.type === "guardian") {
          await GuardianService.setGuardianStatus(responder.id, "standby");
          await GuardianService.awardPoints(responder.id, 120); // Award XP
        }
      }
      return emergency;
    }
    return null;
  }

  static async getActiveEmergency(victimId: string): Promise<IEmergency | null> {
    return await Emergency.findOne({ victimId, status: "ACTIVE" });
  }
}
