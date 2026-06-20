"use client";

import { useLiveTracking } from "@/hooks/useLiveTracking";

/** Mount once in layout to maintain persistent Socket.io connection across portals. */
export function TrackingProvider({ children }: { children: React.ReactNode }) {
  useLiveTracking();
  return <>{children}</>;
}
