import axios from "axios";

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || "";

export interface RouteCoord {
  lat: number;
  lng: number;
}

export interface RouteResult {
  coordinates: RouteCoord[];
  distanceKm: number;
  etaMinutes: number;
  safetyScore: number;
}

export class MapService {
  /**
   * Geocode text search to find location coordinates.
   */
  static async geocode(query: string): Promise<any[]> {
    if (!MAPBOX_TOKEN) {
      // Mock geocode database for local sandbox
      const localDB = [
        { name: "Connaught Place, Block B", lat: 28.6304, lng: 77.2177, type: "landmark" },
        { name: "Noida Metro Station Sector 62", lat: 28.6273, lng: 77.3725, type: "metro_security" },
        { name: "Siri Fort Auditorium, Khel Gaon", lat: 28.5562, lng: 77.2198, type: "landmark" },
        { name: "AIIMS Trauma Center", lat: 28.608, lng: 77.205, type: "hospital" },
        { name: "Fortis Escorts Clinic", lat: 28.627, lng: 77.214, type: "hospital" },
        { name: "CP Police Station", lat: 28.631, lng: 77.219, type: "police" },
        { name: "TravelSafe Guard Hub #03", lat: 28.6280, lng: 77.2220, type: "guardian_hub" },
        { name: "Metro Safe Point Noida", lat: 28.617, lng: 77.213, type: "guardian_hub" }
      ];
      return localDB.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=IN&proximity=77.2,28.6`;
      const response = await axios.get(url);
      if (response.data && response.data.features) {
        return response.data.features.map((f: any) => ({
          name: f.place_name,
          lat: f.center[1],
          lng: f.center[0],
          type: f.properties?.category || "address"
        }));
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    }
    return [];
  }

  /**
   * Reverse geocode coordinates to string address.
   */
  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!MAPBOX_TOKEN) {
      return `New Delhi Coord (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`;
      const response = await axios.get(url);
      if (response.data && response.data.features && response.data.features[0]) {
        return response.data.features[0].place_name;
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
    return `Coord: ${lat}, ${lng}`;
  }

  /**
   * Fetch road routing coordinates from Mapbox Directions API, otherwise fallback to road simulator.
   */
  static async getDirections(
    start: RouteCoord,
    end: RouteCoord,
    profile: "driving" | "walking" | "cycling" = "driving"
  ): Promise<RouteCoord[]> {
    if (!MAPBOX_TOKEN) {
      // Local Turn-by-Turn Road Network Simulator
      const waypoints: RouteCoord[] = [];
      const steps = 24;
      // Simulate typical city grid turns instead of a straight line
      const midLat1 = start.lat + (end.lat - start.lat) * 0.35;
      const midLng1 = start.lng; // Turn 1
      const midLat2 = midLat1;
      const midLng2 = start.lng + (end.lng - start.lng) * 0.7; // Turn 2

      const keyPoints = [start, { lat: midLat1, lng: midLng1 }, { lat: midLat2, lng: midLng2 }, end];
      for (let i = 0; i < keyPoints.length - 1; i++) {
        const pA = keyPoints[i];
        const pB = keyPoints[i + 1];
        const localSteps = steps / 3;
        for (let s = 0; s < localSteps; s++) {
          const t = s / localSteps;
          waypoints.push({
            lat: pA.lat + (pB.lat - pA.lat) * t,
            lng: pA.lng + (pB.lng - pA.lng) * t
          });
        }
      }
      waypoints.push(end);
      return waypoints;
    }

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
      const response = await axios.get(url);
      if (response.data && response.data.routes && response.data.routes[0]) {
        const coords = response.data.routes[0].geometry.coordinates;
        return coords.map(([lng, lat]: [number, number]) => ({ lat, lng }));
      }
    } catch (err) {
      console.error("Mapbox directions retrieval failed:", err);
    }

    // Default fallback to grid lines if directions call errors out
    return this.getDirections(start, end, profile);
  }
}
