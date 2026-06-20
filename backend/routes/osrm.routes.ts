import express from "express";
import {
  getDirections,
  getAlternativeRoutes,
  getMatrix,
  getRouteStatus,
  clearCache,
} from "../controllers/osrm.controller";

const router = express.Router();

/**
 * GET /api/routes/directions
 * Single route between two points
 * @query startLat - Starting latitude
 * @query startLng - Starting longitude
 * @query endLat - Ending latitude
 * @query endLng - Ending longitude
 * @query profile - (optional) "driving" | "walking" | "cycling" (default: "driving")
 *
 * @example
 * GET /api/routes/directions?startLat=28.6304&startLng=77.2177&endLat=28.6273&endLng=77.3725
 */
router.get("/directions", getDirections);

/**
 * GET /api/routes/alternatives
 * Get 3 alternative routes (fastest, safest, recommended)
 * @query startLat - Starting latitude
 * @query startLng - Starting longitude
 * @query endLat - Ending latitude
 * @query endLng - Ending longitude
 *
 * @example
 * GET /api/routes/alternatives?startLat=28.6304&startLng=77.2177&endLat=28.6273&endLng=77.3725
 */
router.get("/alternatives", getAlternativeRoutes);

/**
 * POST /api/routes/matrix
 * Get distance/duration matrix between multiple points
 * @body { coordinates: [{ lat, lng }, { lat, lng }, ...] }
 *
 * @example
 * POST /api/routes/matrix
 * {
 *   "coordinates": [
 *     { "lat": 28.6304, "lng": 77.2177 },
 *     { "lat": 28.6273, "lng": 77.3725 },
 *     { "lat": 28.5562, "lng": 77.2198 }
 *   ]
 * }
 */
router.post("/matrix", getMatrix);

/**
 * GET /api/routes/status
 * Check OSRM service health and configuration
 *
 * @example
 * GET /api/routes/status
 */
router.get("/status", getRouteStatus);

/**
 * POST /api/routes/clear-cache
 * Clear the in-memory route cache
 * Note: Should be protected with auth in production
 */
router.post("/clear-cache", clearCache);

export default router;
