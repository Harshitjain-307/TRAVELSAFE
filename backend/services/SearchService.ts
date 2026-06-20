import { MapService } from "./MapService";
import { SafeZone } from "../models/SafeZone";

export class SearchService {
  static recentSearches: string[] = [
    "Connaught Place, Block B",
    "Noida Metro Station Sector 62",
    "AIIMS Trauma Center"
  ];

  static savedLocations = {
    home: { name: "Home (CP External Circular Rd)", lat: 28.6312, lng: 77.2201 },
    office: { name: "Office (Noida Sector 62, Fortis Block)", lat: 28.6278, lng: 77.3731 }
  };

  static async autocomplete(query: string): Promise<any[]> {
    const mapboxResults = await MapService.geocode(query);
    if (mapboxResults.length > 0) return mapboxResults;

    // Search Safe Zones in database
    const dbZones = await SafeZone.find({ name: new RegExp(query, "i") }).limit(5);
    return dbZones.map(z => ({
      name: z.name,
      lat: z.lat,
      lng: z.lng,
      type: z.type
    }));
  }

  static getRecentSearches(): string[] {
    return this.recentSearches;
  }

  static addRecentSearch(query: string): void {
    if (!this.recentSearches.includes(query)) {
      this.recentSearches.unshift(query);
      if (this.recentSearches.length > 10) this.recentSearches.pop();
    }
  }

  static getSavedLocations(): any {
    return this.savedLocations;
  }
}
