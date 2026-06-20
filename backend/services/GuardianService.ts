import { Guardian, IGuardian } from "../models/Guardian";

export class GuardianService {
  static async registerGuardian(data: any): Promise<IGuardian> {
    const guardian = new Guardian(data);
    await guardian.save();
    return guardian;
  }

  static async updateGuardianLocation(userId: string, lat: number, lng: number): Promise<IGuardian | null> {
    const guardian = await Guardian.findOne({ userId });
    if (guardian) {
      guardian.lat = lat;
      guardian.lng = lng;
      guardian.updatedAt = new Date();
      await guardian.save();
      return guardian;
    }
    return null;
  }

  static async setGuardianStatus(userId: string, status: "standby" | "responding" | "arrived" | "offline"): Promise<IGuardian | null> {
    const guardian = await Guardian.findOne({ userId });
    if (guardian) {
      guardian.status = status;
      guardian.updatedAt = new Date();
      await guardian.save();
      return guardian;
    }
    return null;
  }

  static async awardPoints(userId: string, points: number): Promise<IGuardian | null> {
    const guardian = await Guardian.findOne({ userId });
    if (guardian) {
      guardian.rankPoints += points;
      await guardian.save();
      return guardian;
    }
    return null;
  }

  static async getNearbyGuardians(lat: number, lng: number, radiusKm = 5): Promise<IGuardian[]> {
    // In our local sandbox environment, find active/standby guardians in memory
    return await Guardian.find({ status: { $ne: "offline" } });
  }
}
