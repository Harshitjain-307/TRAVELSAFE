import type { LiveResponder, ResponderStatus, TrackingSnapshot } from "@/types";

export const TRACKING_UPDATE_INTERVAL_MS = 5000;

export function formatDistance(km: number): string {
  if (km < 0.05) return "On Scene";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} KM`;
}

export function formatEta(minutes: number): string {
  if (minutes <= 0) return "Arrived";
  if (minutes === 1) return "1 Minute";
  return `${minutes} Minutes`;
}

export function responderStatusLabel(status: ResponderStatus, type: "guardian" | "police"): string {
  if (status === "arrived") return "Arrived On Scene";
  if (status === "responding") return "Responding";
  if (status === "en_route") return "En Route";
  return type === "guardian" ? "Standby" : "Standby";
}

export function getGuardians(responders: LiveResponder[]): LiveResponder[] {
  return responders.filter((r) => r.type === "guardian");
}

export function getPolice(responders: LiveResponder[]): LiveResponder[] {
  return responders.filter((r) => r.type === "police");
}

export function isTrackingActive(snapshot: TrackingSnapshot | null): boolean {
  return snapshot !== null && snapshot.phase !== "idle" && snapshot.phase !== "RESOLVED";
}

export const SOCKET_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    : process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
