"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useTravelSafeStore } from "@/store/useTravelSafeStore";
import { SOCKET_URL } from "@/lib/tracking";
import type { ResponderUpdatePayload, TrackingSnapshot } from "@/types";

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
    });
  }
  return sharedSocket;
}

export function useLiveTracking() {
  const socketRef = useRef<Socket | null>(null);
  const connected = useTravelSafeStore((s) => s.trackingConnected);
  const snapshot = useTravelSafeStore((s) => s.trackingSnapshot);
  const setTrackingConnected = useTravelSafeStore((s) => s.setTrackingConnected);
  const setTrackingSnapshot = useTravelSafeStore((s) => s.setTrackingSnapshot);
  const updateResponder = useTravelSafeStore((s) => s.updateLiveResponder);
  const addNotification = useTravelSafeStore((s) => s.addNotification);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => setTrackingConnected(true);
    const onDisconnect = () => setTrackingConnected(false);
    const onState = (state: TrackingSnapshot) => setTrackingSnapshot(state);
    const onUpdate = (payload: ResponderUpdatePayload) => updateResponder(payload);
    const onArrived = (data: { name: string; message: string }) => {
      addNotification(`✓ ${data.message}`);
    };
    const onResolved = (data: { message: string }) => {
      addNotification(`✓ ${data.message}`);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("incident:state", onState);
    socket.on("responder:update", onUpdate);
    socket.on("responder:arrived", onArrived);
    socket.on("incident:resolved", onResolved);

    if (socket.connected) setTrackingConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("incident:state", onState);
      socket.off("responder:update", onUpdate);
      socket.off("responder:arrived", onArrived);
      socket.off("incident:resolved", onResolved);
    };
  }, [setTrackingConnected, setTrackingSnapshot, updateResponder, addNotification]);

  const acceptGuardian = useCallback((guardianId = "g-rahul", name = "Rahul Singh") => {
    socketRef.current?.emit("guardian:accept", { guardianId, name });
  }, []);

  const dispatchPolice = useCallback((unitId = "p-14") => {
    socketRef.current?.emit("police:dispatch", { unitId });
  }, []);

  const startDemo = useCallback(() => {
    socketRef.current?.emit("demo:start");
  }, []);

  const stopDemo = useCallback(() => {
    socketRef.current?.emit("demo:stop");
  }, []);

  const joinIncident = useCallback((incidentId: string, role: string) => {
    socketRef.current?.emit("join:incident", { incidentId, role });
  }, []);

  return {
    connected,
    snapshot,
    acceptGuardian,
    dispatchPolice,
    startDemo,
    stopDemo,
    joinIncident,
  };
}
