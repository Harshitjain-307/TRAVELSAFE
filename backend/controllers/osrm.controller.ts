import { Request, Response } from "express";
import { osrmService, type RouteRequest } from "../services/OSRMService";

/**
 * GET /api/routes/directions
 * Get a single route between two points
 * Query params: startLat, startLng, endLat, endLng, profile(optional: driving|walking|cycling)
 */
export const getDirections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startLat, startLng, endLat, endLng, profile } = req.query;

    // Validate required params
    if (!startLat || !startLng || !endLat || !endLng) {
      res.status(400).json({
        success: false,
        error: "Missing required coordinates: startLat, startLng, endLat, endLng",
      });
      return;
    }

    const routeRequest: RouteRequest = {
      start: {
        lat: parseFloat(startLat as string),
        lng: parseFloat(startLng as string),
      },
      end: {
        lat: parseFloat(endLat as string),
        lng: parseFloat(endLng as string),
      },
      profile: (profile as any) || "driving",
    };

    // Validate coordinates are valid numbers
    if (
      isNaN(routeRequest.start.lat) ||
      isNaN(routeRequest.start.lng) ||
      isNaN(routeRequest.end.lat) ||
      isNaN(routeRequest.end.lng)
    ) {
      res.status(400).json({
        success: false,
        error: "Invalid coordinate values",
      });
      return;
    }

    const result = await osrmService.getRoute(routeRequest);

    if (!result.success) {
      res.status(503).json({
        success: false,
        error: result.error || "Failed to fetch route",
      });
      return;
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Directions endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * GET /api/routes/alternatives
 * Get multiple alternative routes
 * Query params: startLat, startLng, endLat, endLng
 */
export const getAlternativeRoutes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startLat, startLng, endLat, endLng } = req.query;

    if (!startLat || !startLng || !endLat || !endLng) {
      res.status(400).json({
        success: false,
        error: "Missing required coordinates",
      });
      return;
    }

    const routeRequest: RouteRequest = {
      start: {
        lat: parseFloat(startLat as string),
        lng: parseFloat(startLng as string),
      },
      end: {
        lat: parseFloat(endLat as string),
        lng: parseFloat(endLng as string),
      },
      profile: "driving",
      alternatives: 3,
    };

    const result = await osrmService.getAlternativeRoutes(routeRequest);

    if (!result.success) {
      res.status(503).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      routes: result.routes,
    });
  } catch (error: any) {
    console.error("Alternative routes endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * POST /api/routes/matrix
 * Get distance/duration matrix between multiple points
 * Body: { coordinates: [{ lat, lng }, ...] }
 */
export const getMatrix = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { coordinates } = req.body;

    if (!coordinates || !Array.isArray(coordinates)) {
      res.status(400).json({
        success: false,
        error: "coordinates array is required in request body",
      });
      return;
    }

    const result = await osrmService.getMatrix(coordinates);

    if (!result.success) {
      res.status(503).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      durations: result.durations,
      distances: result.distances,
    });
  } catch (error: any) {
    console.error("Matrix endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * GET /api/routes/status
 * Check OSRM service health
 */
export const getRouteStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const status = await osrmService.getStatus();
    res.status(200).json({
      success: status.healthy,
      ...status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to check service status",
    });
  }
};

/**
 * POST /api/routes/clear-cache
 * Clear the route cache (admin only in production)
 */
export const clearCache = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    osrmService.clearCache();
    res.status(200).json({
      success: true,
      message: "Route cache cleared",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to clear cache",
    });
  }
};
