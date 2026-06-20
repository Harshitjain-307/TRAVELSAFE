import { LocationHistory, ILocationHistory } from "../models/LocationHistory";

export class LocationService {
  static async logLocation(data: {
    journeyId: string;
    responderId?: string;
    lat: number;
    lng: number;
    speed: number;
    direction: number;
  }): Promise<ILocationHistory> {
    const record = new LocationHistory({
      ...data,
      geojson: {
        type: "Point",
        coordinates: [data.lng, data.lat] // GeoJSON requires [lng, lat] order
      },
      timestamp: new Date()
    });
    await record.save();
    return record;
  }

  static async getHistory(journeyId: string, limit = 100): Promise<ILocationHistory[]> {
    return await LocationHistory.find({ journeyId })
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}
