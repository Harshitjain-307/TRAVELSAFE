export type SystemMode = "SAFE" | "ALERT" | "ESCALATION" | "RESPONSE" | "SOS";

export type TimelineStage = "T-10" | "T-0" | "+5" | "+15";

export interface GuardianNode {
  id: string;
  name: string;
  distance: number;
  status: "active" | "standby" | "responding";
  lat: number;
  lng: number;
}

export interface RouteData {
  id: string;
  name: string;
  safetyScore: number;
  lightingDensity: number;
  crowdDensity: number;
  incidentProbability: number;
  duration: string;
  distance: string;
  coordinates: [number, number][];
  isActive: boolean;
}

export interface EvidenceChunk {
  id: string;
  type: "video" | "audio";
  hash: string;
  timestamp: string;
  size: string;
  verified: boolean;
}

export interface PeerUser {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "journey" | "guardian";
  route: string;
  safetyScore: number;
}

export interface TimelineEvent {
  stage: TimelineStage;
  title: string;
  threatScore: number;
  aiConfidence: number;
  action: string;
  timestamp: string;
  active: boolean;
  completed: boolean;
}

export interface GrabSenseData {
  detectionConfidence: number;
  threatProbability: number;
  modelStatus: "online" | "processing" | "alert";
  biometricLock: boolean;
  inferenceLatency: number;
  waveform: number[];
  acceleration: number[];
  orientation: { x: number; y: number; z: number };
}

export interface SafetyMetrics {
  luminaScore: number;
  guardianCount: number;
  nearbyResponders: number;
  responseTime: string;
  activeThreats: number;
  verifiedUsers: number;
}

export interface EmergencyPacket {
  id: string;
  message: string;
  timestamp: string;
  priority: "critical" | "high" | "medium";
}

export type ResponderType = "guardian" | "police";
export type ResponderStatus = "standby" | "responding" | "en_route" | "arrived";
export type TrackingPhase =
  | "idle"
  | "EMERGENCY_TRIGGERED"
  | "SOS_BROADCAST"
  | "GUARDIAN_EN_ROUTE"
  | "POLICE_EN_ROUTE"
  | "TRACKING_LIVE"
  | "RESOLVED";

export interface RouteWaypoint {
  lat: number;
  lng: number;
}

export interface LiveResponder {
  id: string;
  type: ResponderType;
  name: string;
  officer?: string | null;
  status: ResponderStatus;
  lat: number;
  lng: number;
  speed: number;
  direction: number;
  route: RouteWaypoint[];
  routeProgress: number;
  distanceKm: number;
  etaMinutes: number;
  color: string;
  totalRouteKm: number;
}

export interface MapPointOfInterest {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface TrackingIncident {
  id: string;
  status: string;
  phase: string;
  victim: { id: string; name: string; lat: number; lng: number };
  incidentZone: { lat: number; lng: number; radiusM: number };
  responders: LiveResponder[];
  hospitals: MapPointOfInterest[];
  policeStations: MapPointOfInterest[];
  safeZones: MapPointOfInterest[];
  victimRoute?: RouteWaypoint[];
}

export interface TrackingSnapshot {
  phase: TrackingPhase;
  incident: TrackingIncident | null;
  responders?: LiveResponder[];
  victim?: TrackingIncident["victim"];
  incidentZone?: TrackingIncident["incidentZone"];
  hospitals?: MapPointOfInterest[];
  policeStations?: MapPointOfInterest[];
  safeZones?: MapPointOfInterest[];
  victimRoute?: RouteWaypoint[];
}

export interface ResponderUpdatePayload {
  responderId: string;
  lat: number;
  lng: number;
  speed: number;
  direction: number;
  distanceKm: number;
  etaMinutes: number;
  routeProgress: number;
  status: ResponderStatus;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: "victim" | "guardian" | "police" | "safezone";
}
