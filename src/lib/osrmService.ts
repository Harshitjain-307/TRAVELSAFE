/**
 * OSRM (Open Source Routing Machine) Client-Side Service
 * Fetches real road-based routing from the public OSRM demo server.
 * No API key required. Returns actual road geometry that follows
 * streets, highways, turns, flyovers, and intersections.
 */

export interface OSRMRouteResult {
  coordinates: [number, number][]; // [lat, lng][]
  distanceKm: number;
  durationMinutes: number;
}

// Simple in-memory cache to avoid duplicate requests
const routeCache = new Map<string, OSRMRouteResult>();

function cacheKey(
  startLat: number, startLng: number,
  endLat: number, endLng: number,
  profile: string
): string {
  return `${startLat.toFixed(4)},${startLng.toFixed(4)}-${endLat.toFixed(4)},${endLng.toFixed(4)}-${profile}`;
}

/**
 * Fetch a real road-based route from OSRM.
 * Coordinates follow actual roads, highways, turns, and intersections.
 */
export async function fetchRoadRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: "driving" | "foot" | "bike" = "driving"
): Promise<OSRMRouteResult> {
  const key = cacheKey(startLat, startLng, endLat, endLng, profile);

  // Check cache first
  const cached = routeCache.get(key);
  if (cached) return cached;

  // Map profile names to OSRM profiles
  const osrmProfile = profile === "foot" ? "foot" : profile === "bike" ? "bike" : "car";

  const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`OSRM request failed: ${response.status}`);
      return buildFallbackRoute(startLat, startLng, endLat, endLng);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || !data.routes[0]) {
      console.warn("OSRM returned no routes:", data.code);
      return buildFallbackRoute(startLat, startLng, endLat, endLng);
    }

    const route = data.routes[0];
    // OSRM returns [lng, lat], we need [lat, lng]
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );

    const result: OSRMRouteResult = {
      coordinates,
      distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
      durationMinutes: Math.ceil(route.duration / 60),
    };

    // Cache the result
    routeCache.set(key, result);

    return result;
  } catch (err) {
    console.warn("OSRM fetch error, using fallback:", err);
    return buildFallbackRoute(startLat, startLng, endLat, endLng);
  }
}

/**
 * Fetch a route with an intermediate waypoint (for route adjustment).
 */
export async function fetchRoadRouteWithWaypoint(
  startLat: number,
  startLng: number,
  waypointLat: number,
  waypointLng: number,
  endLat: number,
  endLng: number,
  profile: "driving" | "foot" | "bike" = "driving"
): Promise<OSRMRouteResult> {
  const osrmProfile = profile === "foot" ? "foot" : profile === "bike" ? "bike" : "car";
  const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${waypointLng},${waypointLat};${endLng},${endLat}?geometries=geojson&overview=full`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return buildFallbackRoute(startLat, startLng, endLat, endLng);
    }
    const data = await response.json();
    if (data.code !== "Ok" || !data.routes || !data.routes[0]) {
      return buildFallbackRoute(startLat, startLng, endLat, endLng);
    }

    const route = data.routes[0];
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );

    return {
      coordinates,
      distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
      durationMinutes: Math.ceil(route.duration / 60),
    };
  } catch {
    return buildFallbackRoute(startLat, startLng, endLat, endLng);
  }
}

/**
 * Fetch OSRM alternative routes for Fastest / Safest / Recommended.
 * Uses OSRM's `alternatives=true` to get multiple route options.
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
  const url = `https://router.project-osrm.org/route/v1/car/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full&alternatives=3`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM ${response.status}`);
    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("No routes");
    }

    const parseRoute = (route: any): OSRMRouteResult => ({
      coordinates: route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
      ),
      distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
      durationMinutes: Math.ceil(route.duration / 60),
    });

    // Sort routes: fastest by duration, longest by distance (safest = more main roads)
    const sorted = [...data.routes].sort((a: any, b: any) => a.duration - b.duration);
    const fastest = parseRoute(sorted[0]);

    // Safest is the longest route (avoids shortcuts, sticks to main roads)
    const safestRoute = [...data.routes].sort((a: any, b: any) => b.distance - a.distance);
    const safest = parseRoute(safestRoute[0]);

    // Recommended is the middle option, or first if only 1
    const recommended = data.routes.length >= 3
      ? parseRoute(sorted[1])
      : parseRoute(sorted[0]);

    // Cache each
    routeCache.set(cacheKey(startLat, startLng, endLat, endLng, "fastest"), fastest);
    routeCache.set(cacheKey(startLat, startLng, endLat, endLng, "safest"), safest);
    routeCache.set(cacheKey(startLat, startLng, endLat, endLng, "recommended"), recommended);

    return { fastest, safest, recommended };
  } catch {
    // Fallback: generate 3 slightly different local routes
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
 * Enhanced fallback route generator when OSRM is unreachable.
 * Uses Delhi-specific highway junctions for realistic paths.
 */
function buildFallbackRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): OSRMRouteResult {
  const coords: [number, number][] = [];

  // Known Delhi junction network for realistic fallback
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

  // Find nearest junctions to start and end
  const distTo = (a: [number, number], b: [number, number]) =>
    Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);

  const start: [number, number] = [startLat, startLng];
  const end: [number, number] = [endLat, endLng];

  // Sort junctions by proximity to midpoint of start-end
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;
  const mid: [number, number] = [midLat, midLng];

  const nearbyJunctions = delhiJunctions
    .filter(j => distTo(j, mid) < 0.15)
    .sort((a, b) => distTo(a, start) - distTo(b, start));

  const waypoints: [number, number][] = [start];
  if (nearbyJunctions.length > 0) {
    // Add up to 3 intermediate junctions
    waypoints.push(...nearbyJunctions.slice(0, 3));
  } else {
    // Generate synthetic intermediate points
    const q1Lat = startLat + (endLat - startLat) * 0.33;
    const q1Lng = startLng + (endLng - startLng) * 0.5;
    const q2Lat = startLat + (endLat - startLat) * 0.66;
    const q2Lng = startLng + (endLng - startLng) * 0.75;
    waypoints.push([q1Lat, q1Lng], [q2Lat, q2Lng]);
  }
  waypoints.push(end);

  // Interpolate smoothly between waypoints
  for (let i = 0; i < waypoints.length - 1; i++) {
    const ptA = waypoints[i];
    const ptB = waypoints[i + 1];
    const steps = 12;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      coords.push([
        ptA[0] + (ptB[0] - ptA[0]) * t,
        ptA[1] + (ptB[1] - ptA[1]) * t,
      ]);
    }
  }
  coords.push(end);

  // Estimate distance using Haversine
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
  const estimatedDist = straightLineDist * 1.35; // Road factor

  return {
    coordinates: coords,
    distanceKm: parseFloat(estimatedDist.toFixed(1)),
    durationMinutes: Math.ceil(estimatedDist * 3), // ~20km/h avg
  };
}

/**
 * Clear the route cache (useful when switching contexts).
 */
export function clearRouteCache(): void {
  routeCache.clear();
}
