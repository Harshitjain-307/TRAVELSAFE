"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Shield, ArrowLeft, Radar, Zap, Trophy, ShieldAlert, CheckCircle, Navigation, Radio } from "lucide-react";
import { useTravelSafeStore } from "@/store/useTravelSafeStore";
import { useMockStreams } from "@/hooks/useMockStreams";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import { formatDistance, formatEta, isTrackingActive } from "@/lib/tracking";

const LiveTrackingMap = dynamic(() => import("@/components/tracking/LiveTrackingMap"), { ssr: false });

export default function GuardianPage() {
  useMockStreams();
  const { acceptGuardian, snapshot, connected, stopDemo } = useLiveTracking();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const systemMode = useTravelSafeStore((s) => s.systemMode);
  const activeGuardianMission = useTravelSafeStore((s) => s.activeGuardianMission);
  const acceptGuardianMission = useTravelSafeStore((s) => s.acceptGuardianMission);
  const guardianRadarRange = useTravelSafeStore((s) => s.guardianRadarRange);
  const guardianRankPoints = useTravelSafeStore((s) => s.guardianRankPoints);
  const stopThreatSimulation = useTravelSafeStore((s) => s.stopThreatSimulation);
  const notifications = useTravelSafeStore((s) => s.notifications);

  const isEmergency = systemMode !== "SAFE";
  const trackingActive = isTrackingActive(snapshot);
  const myGuardian = snapshot?.incident?.responders.find((r) => r.id === "g-rahul");

  // Local state
  const [activeTab, setActiveTab] = useState<"alerts" | "rankings">("alerts");

  // Badges listing
  const badges = [
    { title: "Elite Responder", level: "Lvl 4", xp: "480 XP", active: true, color: "text-purple-400 border-purple-500/20" },
    { title: "Gold Guardian", level: "Lvl 3", xp: "300 XP", active: guardianRankPoints >= 300, color: "text-yellow-400 border-yellow-500/20" },
    { title: "Silver Shield", level: "Lvl 2", xp: "150 XP", active: guardianRankPoints >= 150, color: "text-cyan-400 border-cyan-500/20" },
  ];

  // Draw 5KM emergency radar sweep canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let sweepAngle = 0;

    canvas.width = 300;
    canvas.height = 300;

    const drawRadar = () => {
      ctx.clearRect(0, 0, 300, 300);
      const cx = 150;
      const cy = 150;
      const radius = 135;

      // Draw concentric radar lines
      for (let r = radius; r > 0; r -= radius / 4) {
        ctx.strokeStyle = isEmergency ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw cross hairs
      ctx.strokeStyle = isEmergency ? "rgba(239, 68, 68, 0.05)" : "rgba(16, 185, 129, 0.05)";
      ctx.beginPath();
      ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
      ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
      ctx.stroke();

      // Rotating radar sweep beam
      sweepAngle += 0.02;
      const gradient = ctx.createConicGradient(sweepAngle, cx, cy);
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(0.1, isEmergency ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.2)");
      gradient.addColorStop(0.2, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw volunteer guardian center position
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

      // Draw active victim if emergency is active
      if (isEmergency) {
        const vx = cx + Math.sin(timeToX()) * 60;
        const vy = cy + Math.cos(timeToX()) * 50;

        // Pulsing victim marker
        const pulse = (Date.now() % 1500) / 1500;
        ctx.fillStyle = `rgba(239, 68, 68, ${0.4 - pulse * 0.4})`;
        ctx.beginPath(); ctx.arc(vx, vy, 6 + pulse * 20, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = "#ef4444";
        ctx.beginPath(); ctx.arc(vx, vy, 6, 0, Math.PI * 2); ctx.fill();

        // Connect path line from Guardian to victim if mission accepted
        if (activeGuardianMission) {
          ctx.strokeStyle = "rgba(6, 182, 212, 0.45)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(vx, vy); ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      animId = requestAnimationFrame(drawRadar);
    };

    const timeToX = () => Date.now() * 0.0003;

    drawRadar();
    return () => cancelAnimationFrame(animId);
  }, [isEmergency, activeGuardianMission]);

  return (
    <div className={`min-h-screen relative overflow-hidden ${isEmergency ? "grid-bg-emergency bg-[#0d0404]" : "grid-bg bg-[#050508]"} transition-colors duration-1000`}>
      {/* Header operational bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isEmergency ? "bg-red-500/20" : "bg-cyan-500/20"}`}>
              <Shield size={14} className={isEmergency ? "text-red-400" : "text-cyan-400"} />
            </div>
            <span className="text-xs font-bold font-[family-name:var(--font-display)] text-white/95">
              TravelSafe X <span className="text-white/40">· Guardian Node Portal</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[9px] font-bold flex items-center gap-1">
            <Radio size={10} className={connected ? "animate-pulse" : ""} />
            {connected ? "LIVE GPS" : "CONNECTING..."}
          </span>
          <span className="text-[10px] px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[9px] font-bold">
            RADAR ACTIVE: {guardianRadarRange}KM
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
        </div>
      </nav>

      {/* Grid Dashboard */}
      <div className="max-w-6xl mx-auto pt-20 px-4 grid grid-cols-12 gap-4 pb-10">
        
        {/* Left Side: Radar Radar Scanner */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md p-4 flex flex-col items-center">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-1.5 self-start">
              <Radar size={14} className="text-cyan-400" /> Guardian Active Radar
            </h3>
            
            <div className="relative w-[300px] h-[300px] rounded-full border border-white/5 bg-black/40 overflow-hidden flex items-center justify-center">
              <canvas ref={canvasRef} style={{ width: 300, height: 300 }} />
              {isEmergency && (
                <div className="absolute top-2 right-4 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-[8px] font-mono text-red-400 animate-pulse">
                  CRITICAL SIGNAL TARGETED
                </div>
              )}
            </div>
            
            <div className="flex justify-around w-full mt-4 text-[9px] text-white/40 font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> My Node</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Incident</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe Zone</span>
            </div>
          </div>

          {/* Live Navigation Map */}
          {(isEmergency || trackingActive) && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md p-4 space-y-3">
              <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation size={14} className="text-yellow-400" /> Live Navigation Map
              </h3>
              <div className="h-48">
                <LiveTrackingMap snapshot={snapshot} viewMode="guardian" height="192px" showLegend={false} />
              </div>
              {myGuardian && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-[9px] font-mono bg-black/40 border border-white/5 rounded-xl p-3">
                    <div>
                      <span className="text-white/30 block uppercase text-[7px]">Your ETA</span>
                      <span className="text-cyan-400 font-bold">{formatEta(myGuardian.etaMinutes)}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block uppercase text-[7px]">Distance</span>
                      <span className="text-white font-bold">{formatDistance(myGuardian.distanceKm)}</span>
                    </div>
                    <div>
                      <span className="text-white/30 block uppercase text-[7px]">Route Progress</span>
                      <span className="text-yellow-400 font-bold">{Math.round(myGuardian.routeProgress * 100)}%</span>
                    </div>
                  </div>

                  {/* Traffic Conditions & Safe Route Suggestions */}
                  <div className="rounded-xl border border-white/5 bg-black/40 p-3 space-y-2 text-[10px]">
                    <div className="flex justify-between border-b border-white/5 pb-1 text-[8px] font-mono">
                      <span className="text-white/40 uppercase">Traffic Conditions:</span>
                      <span className="text-emerald-400 font-bold">MODERATE DELAYS (Janpath Road)</span>
                    </div>
                    <div className="space-y-1 text-white/60 text-[9px] leading-relaxed">
                      <p>🚦 **Status**: 1.2 KM route has typical traffic. Primary intersections are clear.</p>
                      <p>🛡️ **Safe Suggestion**: Sticking to Janpath Road is recommended. It is fully lit and has 3 peer guardians active nearby.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Logs/Notifications */}
          <div className="rounded-2xl border border-white/5 bg-[#0c0c12]/60 backdrop-blur-md p-4 space-y-3">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={14} className="text-cyan-400" /> Live Response Logs
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {notifications.slice(0, 4).map((log, idx) => (
                <div key={idx} className="p-2 rounded bg-white/[0.02] border border-white/5 text-[9px] font-mono text-white/50 leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Alert list / Mission Responses */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Header tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                activeTab === "alerts"
                  ? "bg-cyan-500/10 border-cyan-500/35 text-cyan-400"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              Alert Response Center
            </button>
            <button
              onClick={() => setActiveTab("rankings")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                activeTab === "rankings"
                  ? "bg-cyan-500/10 border-cyan-500/35 text-cyan-400"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              Community Shield
            </button>
          </div>

          {activeTab === "alerts" && (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {isEmergency ? (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 rounded-2xl border border-red-500/20 bg-red-950/10 backdrop-blur-md space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30">
                          <ShieldAlert size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white font-[family-name:var(--font-display)]">
                            Delhi NCR — CP Sector 7 Anomaly
                          </h4>
                          <p className="text-[10px] text-red-400/80 font-mono mt-0.5">Victim ID: PS-9834-DLI (Priya Sharma)</p>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 font-mono font-bold uppercase animate-pulse">
                        HIGH THREAT
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-black/40 border border-red-500/10 rounded-xl p-3 font-mono">
                      <div>
                        <span className="text-[9px] text-white/30 block uppercase">Signal Strength</span>
                        <span className="text-white/90 font-bold">96% (Optimal)</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-white/30 block uppercase">Distance to Target</span>
                        <span className="text-cyan-400 font-bold">300m</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-white/30 block uppercase">Response ETA</span>
                        <span className="text-cyan-400 font-bold">1.8 minutes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!activeGuardianMission ? (
                        <button
                          onClick={() => {
                            acceptGuardianMission("CP-07");
                            acceptGuardian("g-rahul", "Rahul Singh");
                          }}
                          className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(6,182,212,0.3)]"
                        >
                          <Navigation size={14} /> 🟢 YES, I&apos;M GOING
                        </button>
                      ) : (
                        <div className="flex-1 p-3 rounded-xl border border-cyan-500/35 bg-cyan-500/10 flex items-center justify-between text-xs font-semibold text-cyan-400">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle size={14} /> Live tracking active — sharing coordinates.
                            {myGuardian && (
                              <span className="text-[9px] font-mono text-yellow-400 ml-1">
                                ETA {formatEta(myGuardian.etaMinutes)}
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => acceptGuardianMission(null)}
                            className="text-[9px] underline uppercase tracking-wider text-cyan-400/70 hover:text-cyan-400"
                          >
                            Resign
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => { stopThreatSimulation(); stopDemo(); }}
                        className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all text-xs font-bold uppercase"
                      >
                        De-escalate
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-10 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md text-center space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                      <CheckCircle className="text-emerald-400" size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-white font-[family-name:var(--font-display)]">
                      Operational Sector Clear
                    </h4>
                    <p className="text-[10px] text-white/40 max-w-[280px] mx-auto leading-normal">
                      No active emergency alerts in your 5KM coverage sector. Safety indicators remain nominal.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active responders list */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
                <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Nearest Peer Guardians Online
                </h4>
                <div className="space-y-2">
                  {[
                    { name: "Officer R. Shekhawat", distance: "0.2 km", role: "Police Patrol Unit 1", status: "RESPONDING" },
                    { name: "Amit Trivedi (Volunteer)", distance: "0.9 km", role: "Gold Guardian", status: "STANDBY" },
                    { name: "Sneha Goel (Volunteer)", distance: "1.4 km", role: "Elite Responder", status: "STANDBY" },
                  ].map((peer, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-white/50 font-bold">
                          {peer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="font-semibold text-white/80">{peer.name}</h5>
                          <p className="text-[9px] text-white/30">{peer.role} · {peer.distance} away</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono font-bold ${peer.status === "RESPONDING" ? "text-red-400" : "text-white/40"}`}>
                        {peer.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "rankings" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white font-[family-name:var(--font-display)]">
                      Operational Community Shield
                    </h4>
                    <p className="text-[10px] text-white/40">Point-based rewards for verifying incidents</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-white/30 block uppercase">My Rank Score</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono">{guardianRankPoints} XP</span>
                  </div>
                </div>

                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${(guardianRankPoints / 600) * 100}%` }} />
                </div>
                
                <div className="flex justify-between text-[9px] font-mono text-white/40">
                  <span>Level 4 Elite (Active)</span>
                  <span>600 XP Next Tier</span>
                </div>
              </div>

              {/* Achievements Badges grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {badges.map((badge) => (
                  <div
                    key={badge.title}
                    className={`rounded-xl p-3 border flex flex-col justify-between h-28 transition-all ${
                      badge.active ? "bg-white/[0.02] border-white/10" : "bg-black/30 border-white/5 opacity-55"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Trophy size={16} className={badge.active ? "text-cyan-400" : "text-white/20"} />
                      <span className="text-[9px] font-mono text-white/40">{badge.level}</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white/80">{badge.title}</h5>
                      <span className="text-[9px] text-white/30 block mt-0.5">{badge.xp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
