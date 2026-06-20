import { CabTrip, ICabTrip } from "../models/CabTrip";

export class CabService {
  static async registerCabTrip(data: {
    journeyId: string;
    cabNumber: string;
    driverName: string;
    cabService: string;
    tripId: string;
    photoUrl?: string;
  }): Promise<ICabTrip> {
    const cabTrip = new CabTrip({
      ...data,
      monitoringEnabled: true
    });
    await cabTrip.save();
    return cabTrip;
  }

  static async getCabTrip(journeyId: string): Promise<ICabTrip | null> {
    return await CabTrip.findOne({ journeyId });
  }

  static async toggleMonitoring(journeyId: string, enabled: boolean): Promise<ICabTrip | null> {
    const cabTrip = await CabTrip.findOne({ journeyId });
    if (cabTrip) {
      cabTrip.monitoringEnabled = enabled;
      await cabTrip.save();
      return cabTrip;
    }
    return null;
  }
}
