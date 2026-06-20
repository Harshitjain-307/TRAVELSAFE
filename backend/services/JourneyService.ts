import { Journey, IJourney } from "../models/Journey";
import { MapService, RouteCoord } from "./MapService";

export interface CoPassenger {
  name: string; // First name only
  distance: number; // meters
  direction: "Same Route" | "Converging";
  trustScore: number;
  travelPattern: string;
  mutualRoute: string;
}

export class JourneyService {
  static activeJourneys: Map<string, any> = new Map();

  static async createJourney(data: any): Promise<IJourney> {
    const journey = new Journey(data);
    await journey.save();
    this.activeJourneys.set(journey.id, {
      ...journey.toObject(),
      currentLat: data.startLocation.lat,
      currentLng: data.startLocation.lng,
      lastUpdate: new Date()
    });
    return journey;
  }

  static async updateLocation(journeyId: string, lat: number, lng: number, routeProgress: number): Promise<void> {
    const journey = await Journey.findById(journeyId);
    if (journey) {
      journey.routeProgress = routeProgress;
      await journey.save();
    }
    const cache = this.activeJourneys.get(journeyId);
    if (cache) {
      cache.currentLat = lat;
      cache.currentLng = lng;
      cache.routeProgress = routeProgress;
      cache.lastUpdate = new Date();
      this.activeJourneys.set(journeyId, cache);
    }
  }

  static async endJourney(journeyId: string, status: "COMPLETED" | "ABORTED"): Promise<IJourney | null> {
    const journey = await Journey.findById(journeyId);
    if (journey) {
      journey.status = status;
      journey.endTime = new Date();
      await journey.save();
      this.activeJourneys.delete(journeyId);
      return journey;
    }
    return null;
  }

  /**
   * Find nearby co-passengers who are travelling on the same route/destination region
   */
  static getCoPassengers(lat: number, lng: number, journeyId: string): CoPassenger[] {
    const passengers: CoPassenger[] = [];
    
    // Seed co-passengers for CP / Noida Sector 62 / Siri Fort regions dynamically
    const seedNames = ["Arjun", "Neha", "Rahul", "Karan", "Pooja", "Simran"];
    const seedPatters = ["Daily Commuter", "Student Route", "Office Carpool", "Metro Regular"];
    
    // Check other simulated users near CP or Noida Metro
    seedNames.forEach((name, i) => {
      const distance = 100 + i * 50; // 100m, 150m, 200m, etc.
      passengers.push({
        name,
        distance,
        direction: "Same Route",
        trustScore: 92 + (i % 3),
        travelPattern: seedPatters[i % seedPatters.length],
        mutualRoute: "Connaught Place → Noida Sector 62"
      });
    });

    return passengers;
  }

  /**
   * Safe Route Engine: Calculates details for Recommended, Safest, and Fastest paths.
   */
  static async getSafeRoutes(start: RouteCoord, end: RouteCoord): Promise<any> {
    const baseRoute = await MapService.getDirections(start, end);
    const distanceKm = 4.8; // Seed distances
    
    return {
      recommended: {
        name: "Recommended Route",
        coordinates: baseRoute,
        distanceKm: distanceKm,
        etaMinutes: 18,
        safetyScore: 94,
        safetyRating: "Highly Lit, Active Guardians",
        details: "Lighting: 92% | Guardians: 12 nearby | Crowd: Medium"
      },
      safest: {
        name: "Safest Alternate",
        coordinates: baseRoute, // Follows similar path in sandbox
        distanceKm: distanceKm + 0.9,
        etaMinutes: 22,
        safetyScore: 98,
        safetyRating: "Maximum Police & Safe Zones",
        details: "Lighting: 96% | Police coverage: High | Crowd: Active"
      },
      fastest: {
        name: "Fastest Path",
        coordinates: baseRoute,
        distanceKm: distanceKm - 0.6,
        etaMinutes: 14,
        safetyScore: 87,
        safetyRating: "Moderate Lighting, Less Patrols",
        details: "Lighting: 74% | Guardians: 4 nearby | Crowd: Low"
      }
    };
  }
}
