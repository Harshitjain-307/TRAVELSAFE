"use client";

import { Shield, UserCheck, Car } from "lucide-react";
import type { LiveResponder, TrackingSnapshot } from "@/types";
import { formatDistance, formatEta, getGuardians, getPolice, isTrackingActive, responderStatusLabel } from "@/lib/tracking";

interface ResponderStatusPanelProps {
  snapshot: TrackingSnapshot | null;
  variant?: "civilian" | "guardian" | "police" | "command";
  compact?: boolean;
}

function ResponderCard({ responder, compact }: { responder: LiveResponder; compact?: boolean }) {
  const isGuardian = responder.type === "guardian";
  const arrived = responder.status === "arrived";

  return (
    <div
      className={`rounded-xl border p-3 space-y-2 transition-all ${
        arrived
          ? "border-emerald-500/30 bg-emerald-500/5"
          : isGuardian
            ? "border-yellow-500/20 bg-yellow-500/5"
            : "border-blue-500/20 bg-blue-500/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              isGuardian
                ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                : "border-blue-500/30 bg-blue-500/10 text-blue-400"
            }`}
          >
            {isGuardian ? <UserCheck size={14} /> : <Car size={14} />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-white/90">{responder.name}</h4>
            {!isGuardian && responder.officer && (
              <p className="text-[9px] text-white/40 font-mono">Officer: {responder.officer}</p>
            )}
          </div>
        </div>
        <span
          className={`text-[8px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
            arrived
              ? "bg-emerald-500/20 text-emerald-400"
              : isGuardian
                ? "bg-yellow-500/20 text-yellow-400 animate-pulse"
                : "bg-blue-500/20 text-blue-400 animate-pulse"
          }`}
        >
          {responderStatusLabel(responder.status, responder.type)}
        </span>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
            <span className="text-white/30 block uppercase text-[7px]">Distance</span>
            <span className="text-white font-bold">{formatDistance(responder.distanceKm)}</span>
          </div>
          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
            <span className="text-white/30 block uppercase text-[7px]">ETA</span>
            <span className="text-cyan-400 font-bold">{formatEta(responder.etaMinutes)}</span>
          </div>
        </div>
      )}

      {compact && (
        <div className="flex justify-between text-[9px] font-mono text-white/60">
          <span>{formatDistance(responder.distanceKm)} Away</span>
          <span className="text-cyan-400 font-bold">ETA: {formatEta(responder.etaMinutes)}</span>
        </div>
      )}

      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isGuardian ? "bg-yellow-500" : "bg-blue-500"}`}
          style={{ width: `${Math.round(responder.routeProgress * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function ResponderStatusPanel({ snapshot, variant = "civilian", compact = false }: ResponderStatusPanelProps) {
  const active = isTrackingActive(snapshot);
  const guardians = getGuardians(snapshot?.incident?.responders || snapshot?.responders || []);
  const police = getPolice(snapshot?.incident?.responders || snapshot?.responders || []);

  if (!active) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-center">
        <Shield size={20} className="mx-auto text-white/20 mb-2" />
        <p className="text-[10px] text-white/40">No active responder tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {variant === "civilian" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <span className="text-[10px] font-bold text-red-400 animate-pulse uppercase tracking-wider">
            Live Response Tracking Active
          </span>
        </div>
      )}

      {guardians.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[9px] uppercase tracking-widest text-yellow-400/80 font-bold flex items-center gap-1">
            🛡 Guardian{guardians.length > 1 ? "s" : ""} Responding
          </h4>
          {guardians.map((g) => (
            <ResponderCard key={g.id} responder={g} compact={compact} />
          ))}
        </div>
      )}

      {police.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[9px] uppercase tracking-widest text-blue-400/80 font-bold flex items-center gap-1">
            👮 Police Unit{police.length > 1 ? "s" : ""} Assigned
          </h4>
          {police.map((p) => (
            <ResponderCard key={p.id} responder={p} compact={compact} />
          ))}
        </div>
      )}

      {guardians.length === 0 && police.length === 0 && (
        <p className="text-[10px] text-white/40 text-center py-2">Awaiting responder assignment...</p>
      )}
    </div>
  );
}
