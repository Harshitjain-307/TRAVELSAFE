/**
 * OSRM Service for TravelSafe Backend
 * Provides robust routing with caching, rate limiting, and fallback handling
 * Can use either public OSRM or self-hosted instance
 */

import axios, { AxiosInstance } from "axios";

interface RouteCoordinate {
  lat: number;
  lng: number;
}

interface OSRMRouteResult {
  coordinates: RouteCoordinate[];
  distanceKm: number;
  durationMinutes: number;
}

interface RouteRequest {
  start: RouteCoordinate;
  end: RouteCoordinate;
  waypoints?: RouteCoordinate[];
  profile?: "driving" | "walking" | "cycling";
  alternatives?: number;
}

interface RouteResponse {
  success: boolean;
  route?: OSRMRouteResult;
  routes?: OSRMRouteResult[];
  error?: string;
  cached?: boolean;
}

// Configuration - Use env var or default to public OSRM
const OSRM_BASE_URL =
  process.env.OSRM_BASE_URL || "https://router.project-osrm.org";

// Simple in-memory cache with TTL
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 1000 * 60 * 60; // 1 hour

  set(key: string, value: any): void {
    this.cache.set(key, { data: value, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

class OSRMService {
  private client: AxiosInstance;
  private cache = new CacheManager();
  private requestQueue: any[] = [];
  private isProcessing = false;
  private readonly MAX_REQUESTS_PER_SECOND = 10;
  private lastRequestTime = 0;

  constructor() {
    this.client = axios.create({
      baseURL: OSRM_BASE_URL,
      timeout: 10000,
      headers: {
        "User-Agent": "TravelSafe-Backend/1.0",
      },
    });
  }

  /**
   * Generate cache key for route request
   */
  private generateCacheKey(req: RouteRequest): string {
    const coords = [req.start.lat, req.start.lng, req.end.lat, req.end.lng]
      .map((c) => c.toFixed(4))
      .join(",");
    const waypoints = req.waypoints
      ?.map((w) => `${w.lat.toFixed(4)},${w.lng.toFixed(4)}`)
      .join("|") || "";
    const profile = req.profile || "driving";
    return `${profile}|${coords}|${waypoints}`;
  }

  /**
   * Rate limiter - ensures we don't exceed OSRM rate limits
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / this.MAX_REQUESTS_PER_SECOND;

    if (timeSinceLastRequest < minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, minInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Build OSRM coordinate string
   */
  private buildCoordinateString(
    start: RouteCoordinate,
    end: RouteCoordinate,
    waypoints?: RouteCoordinate[]
  ): string {
    const coords = [
      `${start.lng},${start.lat}`,
      ...(waypoints?.map((w) => `${w.lng},${w.lat}`) || []),
      `${end.lng},${end.lat}`,
    ];
    return coords.join(";");
  }

  /**
   * Fetch single route from OSRM
   */
  async getRoute(req: RouteRequest): Promise<RouteResponse> {
    const cacheKey = this.generateCacheKey(req);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return {
        success: true,
        route: cached,
        cached: true,
      };
    }

    try {
      await this.rateLimit();

      const profile = req.profile || "driving";
      const coords = this.buildCoordinateString(
        req.start,
        req.end,
        req.waypoints
      );

      const response = await this.client.get(
        `/route/v1/${profile}/${coords}`,
        {
          params: {
            geometries: "geojson",
            overview: "full",
            alternatives: req.alternatives ? "true" : "false",
          },
        }
      );

      if (response.data.code !== "Ok" || !response.data.routes?.[0]) {
        return {
          success: false,
          error: `OSRM returned code: ${response.data.code}`,
        };
      }

      const route = response.data.routes[0];
      const result: OSRMRouteResult = {
        coordinates: this.convertOSRMCoordinates(route.geometry.coordinates),
        distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
        durationMinutes: Math.ceil(route.duration / 60),
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      return {
        success: true,
        route: result,
        cached: false,
      };
    } catch (error: any) {
      console.error("OSRM route fetch error:", error.message);
      return {
        success: false,
        error: error.message || "Failed to fetch route",
      };
    }
  }

  /**
   * Get multiple alternative routes
   */
  async getAlternativeRoutes(
    req: RouteRequest
  ): Promise<{
    success: boolean;
    routes?: OSRMRouteResult[];
    error?: string;
  }> {
    try {
      await this.rateLimit();

      const profile = req.profile || "driving";
      const coords = this.buildCoordinateString(req.start, req.end);

      const response = await this.client.get(
        `/route/v1/${profile}/${coords}`,
        {
          params: {
            geometries: "geojson",
            overview: "full",
            alternatives: "3",
          },
        }
      );

      if (response.data.code !== "Ok" || !response.data.routes?.length) {
        return {
          success: false,
          error: `OSRM returned code: ${response.data.code}`,
        };
      }

      const routes = response.data.routes.map((route: any) => ({
        coordinates: this.convertOSRMCoordinates(route.geometry.coordinates),
        distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
        durationMinutes: Math.ceil(route.duration / 60),
      }));

      return {
        success: true,
        routes,
      };
    } catch (error: any) {
      console.error("OSRM alternative routes fetch error:", error.message);
      return {
        success: false,
        error: error.message || "Failed to fetch alternative routes",
      };
    }
  }

  /**
   * Get matrix of distances/times between multiple points
   */
  async getMatrix(coordinates: RouteCoordinate[]): Promise<{
    success: boolean;
    durations?: number[][];
    distances?: number[][];
    error?: string;
  }> {
    try {
      if (coordinates.length < 2 || coordinates.length > 100) {
        return {
          success: false,
          error: "Matrix requires 2-100 coordinates",
        };
      }

      await this.rateLimit();

      const profile = "driving";
      const coords = coordinates
        .map((c) => `${c.lng},${c.lat}`)
        .join(";");

      const response = await this.client.get(`/table/v1/${profile}/${coords}`);

      if (
        response.data.code !== "Ok" ||
        !response.data.durations ||
        !response.data.distances
      ) {
        return {
          success: false,
          error: `OSRM matrix returned code: ${response.data.code}`,
        };
      }

      return {
        success: true,
        durations: response.data.durations,
        distances: response.data.distances,
      };
    } catch (error: any) {
      console.error("OSRM matrix fetch error:", error.message);
      return {
        success: false,
        error: error.message || "Failed to fetch matrix",
      };
    }
  }

  /**
   * Convert OSRM [lng, lat] to our [lat, lng] format
   */
  private convertOSRMCoordinates(
    coords: [number, number][]
  ): RouteCoordinate[] {
    return coords.map(([lng, lat]) => ({ lat, lng }));
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{
    healthy: boolean;
    baseUrl: string;
    cacheSize: number;
  }> {
    try {
      const response = await this.client.get("/status");
      return {
        healthy: response.status === 200,
        baseUrl: OSRM_BASE_URL,
        cacheSize: 0, // Cache size would be from cache manager
      };
    } catch (error) {
      return {
        healthy: false,
        baseUrl: OSRM_BASE_URL,
        cacheSize: 0,
      };
    }
  }
}

// Singleton instance
export const osrmService = new OSRMService();

export type { RouteCoordinate, OSRMRouteResult, RouteRequest, RouteResponse };
