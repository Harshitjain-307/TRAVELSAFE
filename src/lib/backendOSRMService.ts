/**
 * Backend OSRM Service for Frontend
 * Calls TravelSafe backend OSRM API instead of public OSRM directly
 * Provides better caching, rate limiting, and control
 */

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface OSRMRouteResult {
  coordinates: RouteCoordinate[];
  distanceKm: number;
  durationMinutes: number;
}

export interface RouteResponse {
  success: boolean;
  route?: OSRMRouteResult;
  routes?: OSRMRouteResult[];
  error?: string;
  cached?: boolean;
}

// Get backend URL from environment or default
const getBackendUrl = (): string => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  }

  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001"
  );
};

/**
 * Fetch directions from backend OSRM service
 */
export async function fetchDirections(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: "driving" | "walking" | "cycling" = "driving"
): Promise<OSRMRouteResult> {
  try {
    const backendUrl = getBackendUrl();
    const url = new URL("/api/routes/directions", backendUrl);

    url.searchParams.append("startLat", String(startLat));
    url.searchParams.append("startLng", String(startLng));
    url.searchParams.append("endLat", String(endLat));
    url.searchParams.append("endLng", String(endLng));
    url.searchParams.append("profile", profile);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data: RouteResponse = await response.json();

    if (!data.success || !data.route) {
      throw new Error(data.error || "Failed to fetch route");
    }

    return data.route;
  } catch (error) {
    console.error("fetchDirections error:", error);
    // Return fallback route if backend fails
    return buildFallbackRoute(startLat, startLng, endLat, endLng);
  }
}

/**
 * Fetch alternative routes from backend
 */
export async function fetchAlternativeRoutes(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<{
  fastest: OSRMRouteResult;
  safest: OSRMRouteResult;
  recommended: OSRMRouteResult;
}> {
  try {
    const backendUrl = getBackendUrl();
    const url = new URL("/api/routes/alternatives", backendUrl);

    url.searchParams.append("startLat", String(startLat));
    url.searchParams.append("startLng", String(startLng));
    url.searchParams.append("endLat", String(endLat));
    url.searchParams.append("endLng", String(endLng));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data: RouteResponse = await response.json();

    if (!data.success || !data.routes || data.routes.length < 3) {
      throw new Error("Failed to fetch alternative routes");
    }

    return {
      fastest: data.routes[0],
      safest: data.routes[1],
      recommended: data.routes[2],
    };
  } catch (error) {
    console.error("fetchAlternativeRoutes error:", error);

    // Fallback: return 3 variations of base route
    const base = buildFallbackRoute(startLat, startLng, endLat, endLng);
    return {
      fastest: base,
      safest: {
        ...base,
        distanceKm: parseFloat((base.distanceKm * 1.2).toFixed(1)),
        durationMinutes: Math.ceil(base.durationMinutes * 1.3),
      },
      recommended: {
        ...base,
        distanceKm: parseFloat((base.distanceKm * 1.1).toFixed(1)),
        durationMinutes: Math.ceil(base.durationMinutes * 1.1),
      },
    };
  }
}

/**
 * Check backend OSRM service health
 */
export async function checkServiceHealth(): Promise<{
  healthy: boolean;
  baseUrl: string;
  message: string;
}> {
  try {
    const backendUrl = getBackendUrl();
    const url = new URL("/api/routes/status", backendUrl);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {
        healthy: false,
        baseUrl: backendUrl,
        message: "Backend unreachable",
      };
    }

    const data = await response.json();
    return {
      healthy: data.success,
      baseUrl: data.baseUrl || backendUrl,
      message: data.success ? "OSRM service healthy" : "OSRM service down",
    };
  } catch (error) {
    console.error("Health check error:", error);
    return {
      healthy: false,
      baseUrl: getBackendUrl(),
      message: "Cannot connect to backend",
    };
  }
}

/**
 * Fallback route generator (same as original osrmService)
 */
function buildFallbackRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): OSRMRouteResult {
  const coords: RouteCoordinate[] = [];

  // Delhi junction network for realistic fallback
  const delhiJunctions: [number, number][] = [
    [28.6304, 77.2177], // CP
    [28.6250, 77.2350], // Mandi House
    [28.6180, 77.2500], // Pragati Maidan
    [28.6150, 77.2180], // Janpath
    [28.5920, 77.2220], // Lodhi Road
    [28.6280, 77.2550], // Vikas Marg
    [28.5900, 77.2750], // DND Entrance
    [28.6200, 77.3300], // Patparganj
    [28.6273, 77.3725], // Noida Sec 62
    [28.5562, 77.2198], // Siri Fort
    [28.6080, 77.2050], // AIIMS
    [28.5850, 77.2650], // Mayur Vihar
  ];

  const distTo = (a: [number, number], b: [number, number]) =>
    Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);

  const start: [number, number] = [startLat, startLng];
  const end: [number, number] = [endLat, endLng];
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;
  const mid: [number, number] = [midLat, midLng];

  const nearbyJunctions = delhiJunctions
    .filter((j) => distTo(j, mid) < 0.15)
    .sort((a, b) => distTo(a, start) - distTo(b, start));

  const waypoints: [number, number][] = [start];
  if (nearbyJunctions.length > 0) {
    waypoints.push(...nearbyJunctions.slice(0, 3));
  } else {
    const q1Lat = startLat + (endLat - startLat) * 0.33;
    const q1Lng = startLng + (endLng - startLng) * 0.5;
    const q2Lat = startLat + (endLat - startLat) * 0.66;
    const q2Lng = startLng + (endLng - startLng) * 0.75;
    waypoints.push([q1Lat, q1Lng], [q2Lat, q2Lng]);
  }
  waypoints.push(end);

  for (let i = 0; i < waypoints.length - 1; i++) {
    const ptA = waypoints[i];
    const ptB = waypoints[i + 1];
    const steps = 12;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      coords.push({
        lat: ptA[0] + (ptB[0] - ptA[0]) * t,
        lng: ptA[1] + (ptB[1] - ptA[1]) * t,
      });
    }
  }
  coords.push({ lat: end[0], lng: end[1] });

  // Haversine distance
  const R = 6371;
  const dLat = ((endLat - startLat) * Math.PI) / 180;
  const dLng = ((endLng - startLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((startLat * Math.PI) / 180) *
      Math.cos((endLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineDist = R * c;
  const estimatedDist = straightLineDist * 1.35;

  return {
    coordinates: coords,
    distanceKm: parseFloat(estimatedDist.toFixed(1)),
    durationMinutes: Math.ceil(estimatedDist * 3),
  };
}
