"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  FileText,
  Layers,
  Activity,
  Play,
  RotateCcw,
  AlertOctagon,
  TrendingUp,
  Bell,
  Radio,
  Car,
} from "lucide-react";
import { useTravelSafeStore } from "@/store/useTravelSafeStore";
import { useMockStreams } from "@/hooks/useMockStreams";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import { ResponderStatusPanel } from "@/components/tracking/ResponderStatusPanel";
import { formatDistance, formatEta, getGuardians, getPolice, isTrackingActive } from "@/lib/tracking";
import dynamic from "next/dynamic";

const CrimeChart = dynamic(() => import("@/components/police/CrimeChart"), {
  ssr: false,
});

const PoliceCommandMap = dynamic(() => import("@/components/police/PoliceCommandMap"), {
  ssr: false,
});

const LiveTrackingMap = dynamic(() => import("@/components/tracking/LiveTrackingMap"), {
  ssr: false,
});

interface TimelineLog {
  time: string;
  msg: string;
  type: "info" | "alert" | "dispatch" | "success";
}

export default function PolicePage() {
  useMockStreams();

  const setSystemMode = useTravelSafeStore((s) => s.setSystemMode);
  const addNotification = useTravelSafeStore((s) => s.addNotification);
  const dispatchPoliceUnit = useTravelSafeStore((s) => s.dispatchPoliceUnit);
  const { startDemo, stopDemo, dispatchPolice, snapshot, connected } = useLiveTracking();

  const trackingActive = isTrackingActive(snapshot);
  const liveGuardians = getGuardians(snapshot?.incident?.responders || []);
  const livePolice = getPolice(snapshot?.incident?.responders || []);

  // Simulation Controls & Position states
  const [isPlaying, setIsPlaying] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [incidentState, setIncidentState] = useState<"SAFE" | "ACTIVE_JOURNEY" | "INCIDENT_ALERT" | "TRACKING" | "RECOVERED">("SAFE");

  // Authentication & Officer info
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [officerId, setOfficerId] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Dispatch selector
  const [vehicleType, setVehicleType] = useState<"pcr" | "interceptor" | "bike">("pcr");
  const [dispatchStatus, setDispatchStatus] = useState<"Standby" | "En Route" | "On Scene">("Standby");

  // FIR states
  const [firStatusText, setFirStatusText] = useState("");

  // Moving coordinate positions for Noida Sector 62 & 63
  const [positions, setPositions] = useState({
    victim: [28.6273, 77.3725] as [number, number],
    device: [28.6273, 77.3725] as [number, number],
    police: [28.6300, 77.3650] as [number, number],
    guardian: [28.6225, 77.3660] as [number, number]
  });

  const [metrics, setMetrics] = useState({
    speed: 15,
    covered: 0.8,
    remaining: 4.3,
    direction: "SW",
    eta: "12 Minutes"
  });

  // Layer Visibility Toggles
  const [layers, setLayers] = useState({
    victimRoute: true,
    deviceRoute: true,
    guardianRoutes: true,
    policeRoutes: true,
    safeZones: true,
    hospitals: true,
    cctv: true,
    hotspots: true,
    traffic: false
  });

  const [timelineLogs, setTimelineLogs] = useState<TimelineLog[]>([
    { time: "22:45 PM", msg: "Police Command Terminal online & listening.", type: "info" }
  ]);

  const addLog = useCallback((time: string, msg: string, type: "info" | "alert" | "dispatch" | "success") => {
    setTimelineLogs((prev) => [{ time, msg, type }, ...prev]);
  }, []);

  // Hotspots Crime Index Hourly chart data
  const crimeTrends = [
    { hour: "00:00", crimeIndex: 45 },
    { hour: "04:00", crimeIndex: 30 },
    { hour: "08:00", crimeIndex: 15 },
    { hour: "12:00", crimeIndex: 20 },
    { hour: "16:00", crimeIndex: 35 },
    { hour: "20:00", crimeIndex: 78 },
    { hour: "23:59", crimeIndex: 90 },
  ];

  // Simulation Runner Loop
  useEffect(() => {
    if (!isPlaying) return;

    let timer: NodeJS.Timeout;

    const runSimulation = () => {
      switch (simStep) {
        case 0: // Commuter is travelling normally (Green Route)
          setIncidentState("ACTIVE_JOURNEY");
          setDispatchStatus("Standby");
          setPositions({
            victim: [28.6285, 77.3715],
            device: [28.6285, 77.3715],
            police: [28.6300, 77.3650],
            guardian: [28.6225, 77.3660]
          });
          setMetrics({
            speed: 15,
            covered: 0.8,
            remaining: 4.3,
            direction: "SW",
            eta: "12 Minutes"
          });
          addLog("22:47 PM", "Priya Sharma started active journey (Sector 62 → Metro).", "info");
          break;

        case 1: // Emergency Detected (Phone Snatch + Scream)
          setSystemMode("ALERT");
          setIncidentState("INCIDENT_ALERT");
          setDispatchStatus("En Route");
          setPositions({
            victim: [28.6310, 77.3780],
            device: [28.6310, 77.3780],
            police: [28.6300, 77.3650],
            guardian: [28.6225, 77.3660]
          });
          setMetrics({
            speed: 0,
            covered: 1.4,
            remaining: 3.7,
            direction: "--",
            eta: "--"
          });
          addLog("22:52 PM", "⚠️ THREAT DETECTED: Phone Snatch event at Sector 63, Noida (98% Conf).", "alert");
          addLog("22:52 PM", "🎙️ VoiceShield: Audio distress screamed. FRONT CAMERA ACTIVATED.", "alert");
          addNotification("🚨 Emergency Alert Noida Sector 63: Combined Sensor Trigger!");
          break;

        case 2: // Device Fleeing, Responders Accepting
          setIncidentState("TRACKING");
          setDispatchStatus("En Route");
          setPositions({
            victim: [28.6310, 77.3780], // Stranded
            device: [28.6340, 77.3750], // Fleeing
            police: [28.6320, 77.3670], // Moving
            guardian: [28.6250, 77.3700] // Moving
          });
          setMetrics({
            speed: 52,
            covered: 1.7,
            remaining: 1.2,
            direction: "N-NE",
            eta: "3 Minutes"
          });
          addLog("22:53 PM", "Witness Ledger locked. Recording stream pushed to blockchain.", "info");
          addLog("22:53 PM", "Guardian SOS propagation sent to 847 local nodes.", "info");
          addLog("22:54 PM", "Aadhaar Guardian Rahul Singh ACCEPTED mission (ETA: 4m).", "dispatch");
          break;

        case 3: // Interception Closes
          setDispatchStatus("En Route");
          setPositions({
            victim: [28.6310, 77.3780],
            device: [28.6360, 77.3720],
            police: [28.6350, 77.3690],
            guardian: [28.6280, 77.3740]
          });
          setMetrics({
            speed: 34,
            covered: 2.1,
            remaining: 0.3,
            direction: "NW",
            eta: "1 Minute"
          });
          addLog("22:55 PM", "PCR Unit P-14 dispatched from Noida Sector 62 PS.", "dispatch");
          addLog("22:58 PM", "PCR Unit P-14 closing coordinates. Distance: 300m.", "dispatch");
          break;

        case 4: // Intercepted and Recovered
          setIncidentState("RECOVERED");
          setSystemMode("SAFE");
          setDispatchStatus("On Scene");
          setPositions({
            victim: [28.6310, 77.3780],
            device: [28.6360, 77.3720],
            police: [28.6360, 77.3720],
            guardian: [28.6310, 77.3780]
          });
          setMetrics({
            speed: 0,
            covered: 2.4,
            remaining: 0,
            direction: "--",
            eta: "0 Minutes"
          });
          addLog("23:01 PM", "✓ SUCCESS: Stolen device recovered. Suspect detained.", "success");
          addLog("23:02 PM", "✓ Auto-FIR Draft pushed to Sector 62 Magistrate queue.", "success");
          addNotification("Police Command: Incident resolved. Commuter safe.");
          setIsPlaying(false);
          break;
      }

      if (simStep < 4) {
        timer = setTimeout(() => {
          setSimStep((prev) => prev + 1);
        }, 5000);
      }
    };

    runSimulation();

    return () => clearTimeout(timer);
  }, [isPlaying, simStep, setSystemMode, addNotification, addLog]);

  const handleStartSim = () => {
    setSimStep(0);
    setIsPlaying(true);
    startDemo();
    setSystemMode("ALERT");
  };

  const handleResetSim = () => {
    setIsPlaying(false);
    setSimStep(0);
    setIncidentState("SAFE");
    setSystemMode("SAFE");
    stopDemo();
    setDispatchStatus("Standby");
    setFirStatusText("");
    setPositions({
      victim: [28.6273, 77.3725],
      device: [28.6273, 77.3725],
      police: [28.6300, 77.3650],
      guardian: [28.6225, 77.3660]
    });
    setMetrics({
      speed: 15,
      covered: 0.8,
      remaining: 4.3,
      direction: "SW",
      eta: "12 Minutes"
    });
    setTimelineLogs([
      { time: "22:45 PM", msg: "Police Command Terminal online & listening.", type: "info" }
    ]);
  };

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const isEmergencyActive = incidentState !== "SAFE" && incidentState !== "ACTIVE_JOURNEY" && incidentState !== "RECOVERED";
  const showLiveMap = trackingActive || isEmergencyActive;

  return (
    <div className={`min-h-screen relative overflow-hidden ${isEmergencyActive ? "grid-bg-emergency bg-[#0d0404]" : "grid-bg bg-[#050508]"} transition-colors duration-1000 text-white`}>
      
      {/* Top HUD Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isEmergencyActive ? "bg-red-500/20" : "bg-purple-500/20"}`}>
              <Shield size={14} className={isEmergencyActive ? "text-red-400" : "text-purple-400"} />
            </div>
            <span className="text-xs font-bold font-[family-name:var(--font-display)] text-white/95">
              TravelSafe X <span className="text-white/40">· National Safety Command Desk</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <div className="flex items-center gap-2.5 border-r border-white/10 pr-4 mr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left font-mono">
                <span className="text-[9px] font-bold text-white/90 block">Inspector Vikram Sharma</span>
                <span className="text-[7px] text-white/40 block">Sub-Inspector · Sector 62 PS, Noida (Delhi-NCR East)</span>
              </div>
            </div>
          )}
          <span className="text-[10px] px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[9px] font-bold flex items-center gap-1">
            <Radio size={10} className={connected ? "animate-pulse" : ""} />
            {connected ? "LIVE GPS" : "CONNECTING"}
          </span>
          <span className="text-[10px] px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[9px] font-bold">
            SECTOR: DELHI-NCR COMMAND
          </span>
          <span className={`w-2.5 h-2.5 rounded-full ${isEmergencyActive || trackingActive ? "bg-red-500 animate-pulse" : "bg-purple-400"}`} />
        </div>
      </nav>

      {/* Dashboard Grid Layout */}
      <div className="max-w-7xl mx-auto pt-20 px-4 grid grid-cols-12 gap-5 pb-10">
        
        {/* LEFT COLUMN: Map Controls, Live Stats & Layer Filters */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          
          {/* Simulator Panel */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0f]/90 p-5 space-y-4 shadow-2xl relative overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <Activity size={14} className="text-purple-400" /> Operational Controls
            </h3>
            
            <div className="flex gap-2">
              <button
                onClick={handleStartSim}
                disabled={isPlaying}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 ${
                  isPlaying
                    ? "bg-purple-500/10 border-purple-500/20 text-purple-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-purple-600 border-red-500/20 text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                }`}
              >
                <Play size={12} /> Simulate Emergency
              </button>
              
              <button
                onClick={handleResetSim}
                className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all text-xs font-bold uppercase"
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Simulated Live Stats */}
            {incidentState !== "SAFE" && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2.5 font-mono text-[10px]">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white/40">Status:</span>
                  <span className={`font-bold ${isEmergencyActive ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                    {incidentState}
                  </span>
                </div>
                <div className="space-y-1 text-white/60">
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span className="text-white font-bold">{metrics.speed} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vector:</span>
                    <span className="text-white font-bold">{metrics.direction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ETA:</span>
                    <span className="text-cyan-400 font-bold">{metrics.eta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance Covered:</span>
                    <span className="text-white font-bold">{metrics.covered} KM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Dist:</span>
                    <span className="text-white font-bold">{metrics.remaining} KM</span>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Dispatch Center */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-3">
              <span className="text-[8px] uppercase tracking-wider text-purple-400 font-bold block">🚨 Tactical Dispatch Center</span>
              
              <div className="space-y-1.5">
                <label className="text-[8px] text-white/40 block font-mono">SELECT UNIT VEHICLE</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as 'pcr' | 'interceptor' | 'bike')}
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-[9px] text-white/80 focus:border-purple-500 outline-none"
                >
                  <option value="pcr">PCR Van (Alpha-1)</option>
                  <option value="interceptor">High-Speed Interceptor (Beta-4)</option>
                  <option value="bike">Patrol Bike (Charlie-2)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded">
                  <span className="text-white/30 block text-[7px] uppercase font-bold">Assigned Officer</span>
                  <span className="text-white font-semibold truncate block">
                    {vehicleType === "pcr" ? "Officer Amit Kumar" : vehicleType === "interceptor" ? "Inspector V. Sharma" : "Officer Rahul Dev"}
                  </span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded">
                  <span className="text-white/30 block text-[7px] uppercase font-bold">Unit Status</span>
                  <span className={`font-bold block ${dispatchStatus === "On Scene" ? "text-emerald-400 animate-pulse" : dispatchStatus === "En Route" ? "text-amber-400" : "text-white/40"}`}>
                    {dispatchStatus}
                  </span>
                </div>
              </div>

              {incidentState !== "SAFE" && (
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded text-[9px] font-mono flex justify-between items-center">
                  <span className="text-white/40">Unit ETA:</span>
                  <span className="text-cyan-400 font-bold">{metrics.eta !== "--" ? metrics.eta : "4 Minutes"}</span>
                </div>
              )}
            </div>

            {/* Live Responder Dispatch */}
            {(trackingActive || isEmergencyActive) && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[8px] uppercase tracking-wider text-blue-400 font-bold block">Live Responder Status</span>
                {liveGuardians.map((g) => (
                  <div key={g.id} className="flex justify-between text-[9px] font-mono text-white/60">
                    <span className="text-yellow-400">🟡 {g.name}</span>
                    <span>{formatDistance(g.distanceKm)} · ETA {formatEta(g.etaMinutes)}</span>
                  </div>
                ))}
                {livePolice.map((p) => (
                  <div key={p.id} className="flex justify-between text-[9px] font-mono text-white/60">
                    <span className="text-blue-400">🔵 {p.name}</span>
                    <span>{formatDistance(p.distanceKm)} · ETA {formatEta(p.etaMinutes)}</span>
                  </div>
                ))}
                {livePolice.length === 0 && (
                  <button
                    onClick={() => {
                      dispatchPolice("p-14");
                      dispatchPoliceUnit("u1", true);
                    }}
                    className="w-full py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[9px] font-bold uppercase flex items-center justify-center gap-1 hover:bg-blue-600/30"
                  >
                    <Car size={10} /> Dispatch {vehicleType === "pcr" ? "PCR Van (Alpha-1)" : vehicleType === "interceptor" ? "Interceptor (Beta-4)" : "Patrol Bike (Charlie-2)"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Layer Filter Panel */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <Layers size={14} className="text-cyan-400" /> Map Layer Filters
            </h3>
            
            <div className="space-y-1.5">
              {[
                { key: "victimRoute" as const, label: "Victim Route (Green)", color: "border-emerald-500/20 text-emerald-400" },
                { key: "deviceRoute" as const, label: "Stolen Device Path (Red)", color: "border-red-500/20 text-red-400" },
                { key: "policeRoutes" as const, label: "Police Intercepts (Blue)", color: "border-blue-500/20 text-blue-400" },
                { key: "guardianRoutes" as const, label: "Guardian Rescue Paths", color: "border-yellow-500/20 text-yellow-400" },
                { key: "safeZones" as const, label: "TravelSafe Guard Hubs", color: "border-emerald-500/20 text-emerald-500" },
                { key: "hospitals" as const, label: "Hospital Locations", color: "border-pink-500/20 text-pink-400" },
                { key: "cctv" as const, label: "CCTV Camera Feeds", color: "border-cyan-500/20 text-cyan-400" },
                { key: "hotspots" as const, label: "Crime Hotspots Radar", color: "border-orange-500/20 text-orange-400" },
                { key: "traffic" as const, label: "Road Traffic Index", color: "border-zinc-500/20 text-zinc-400" },
              ].map((layer) => (
                <button
                  key={layer.key}
                  onClick={() => toggleLayer(layer.key)}
                  className={`w-full p-2.5 rounded-xl border text-left text-[10px] font-semibold flex items-center justify-between transition-all ${
                    layers[layer.key]
                      ? "bg-white/5 border-white/10 text-white"
                      : "bg-transparent border-transparent text-white/30 hover:text-white/50"
                  }`}
                >
                  <span>{layer.label}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${layers[layer.key] ? "bg-cyan-400" : "bg-transparent border border-white/20"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: The Advanced Live Interception Map */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          
          {/* Header live state warning */}
          <div className="relative rounded-2xl border border-white/5 bg-[#0a0a0f]/90 p-4 shadow-lg overflow-hidden flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isEmergencyActive ? "bg-red-500/10 border-red-500/20 animate-pulse text-red-400" : "bg-purple-500/10 border-purple-500/20 text-purple-400"}`}>
                <AlertOctagon size={18} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-[family-name:var(--font-display)]">
                  {isEmergencyActive ? "🚨 INCIDENT DETECTED in Noida Sector 63" : "Active Dispatch Console"}
                </h2>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {isEmergencyActive ? "Phone Snatch + Scream trigger verified by Aadhaar profile." : "Listening for device snatches or vocal distress calls."}
                </p>
              </div>
            </div>
            
            {isEmergencyActive && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-mono font-bold animate-pulse">
                98% CRITICAL THREAT
              </span>
            )}
          </div>

          {/* Map Display Container */}
          <div className="relative rounded-3xl border border-white/10 bg-black/40 overflow-hidden h-[460px] shadow-2xl">
            {showLiveMap && trackingActive ? (
              <LiveTrackingMap snapshot={snapshot} viewMode="command" height="460px" />
            ) : (
              <PoliceCommandMap
                isEmergency={isEmergencyActive}
                simStep={simStep}
                layers={layers}
                victimPos={positions.victim}
                devicePos={positions.device}
                policePos={positions.police}
                guardianPos={positions.guardian}
              />
            )}

            {/* Top Left Live HUD indicator */}
            <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-black/85 border border-white/10 backdrop-blur-md space-y-1 text-[8px] font-mono text-white/50">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>GPS SYNC STATUS: OPTIMAL</span>
              </div>
              <div>LOC: NOIDA SECTOR 62/63 MATRIX</div>
            </div>

            {/* Bottom Left Interception Panel overlay */}
            {(isEmergencyActive || trackingActive) && (
              <div className="absolute bottom-4 left-4 z-20 p-3 rounded-2xl bg-black/90 border border-white/10 backdrop-blur-md max-w-[240px] space-y-2 text-[9px] font-mono">
                <span className="text-[8px] uppercase tracking-wider text-cyan-400 font-bold block">LIVE INTERCEPTION</span>
                <ResponderStatusPanel snapshot={snapshot} variant="police" compact />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Chronological Timeline Panel & AI FIR submission */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          
          {/* Timeline Desk */}
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0f]/90 p-4 space-y-3 flex-1 flex flex-col justify-between h-[360px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <Bell size={14} className="text-purple-400" /> Command Incident Logs
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 my-2 space-y-3 font-mono text-[9px] scrollbar-none max-h-[260px]">
              {timelineLogs.map((log, i) => (
                <div key={i} className="flex gap-2 items-start border-l border-white/10 pl-2.5 py-0.5">
                  <span className="text-purple-400 whitespace-nowrap">{log.time}</span>
                  <div className="space-y-0.5">
                    <p className={`leading-relaxed ${
                      log.type === "alert"
                        ? "text-red-400 font-bold"
                        : log.type === "dispatch"
                          ? "text-cyan-400"
                          : log.type === "success"
                            ? "text-emerald-400 font-semibold"
                            : "text-white/50"
                    }`}>{log.msg}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[7px] text-white/20 select-none text-center">
              SYSTEM INCIDENT AUDIT LEDGER COMPLIANT
            </div>
          </div>

          {/* AI FIR Portal tab preview */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <FileText size={14} className="text-purple-400" /> AI Auto-FIR Center
              </h3>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                incidentState === "RECOVERED" ? "bg-emerald-500/20 text-emerald-400" : isEmergencyActive ? "bg-amber-500/20 text-amber-400 animate-pulse" : "bg-zinc-800 text-white/30"
              }`}>
                {incidentState === "RECOVERED" ? "COMPILED" : isEmergencyActive ? "EVALUATING" : "STANDBY"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/5 h-36 overflow-y-auto font-mono text-[9px] text-white/50 space-y-2 leading-relaxed font-mono">
              {incidentState !== "SAFE" ? (
                <>
                  <p className="text-center font-bold text-white border-b border-white/5 pb-1">FIR RECORD SUMMARY</p>
                  <p><strong>P.S.:</strong> Sector 62 Station · <strong>District:</strong> Noida</p>
                  <p><strong>Complainant:</strong> Priya Sharma (Aadhaar verified)</p>
                  <p><strong>Incident Hash:</strong> 0x7e4a1b3f8c...merkle</p>
                  <p><strong>Offense:</strong> Theft / Snatch (Section 379 IPC / Section 303 BNS)</p>
                  {incidentState === "RECOVERED" && (
                    <p className="text-emerald-400 font-bold">✓ Suspect neutralized, device recovered, case ready for legal closure.</p>
                  )}
                  {firStatusText && (
                    <p className="text-yellow-400 font-bold mt-2 border-t border-white/5 pt-1.5 animate-pulse">
                      Status: {firStatusText}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-white/20">
                  <FileText size={16} />
                  <p className="mt-1">Waiting for incident trigger...</p>
                </div>
              )}
            </div>

            {incidentState === "RECOVERED" && (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => setFirStatusText("FIR Approved. Digitally signed via Aadhaar.")}
                  className="py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[8px] uppercase tracking-wider text-center transition-all"
                >
                  Approve FIR
                </button>
                <button
                  onClick={() => setFirStatusText("Draft open for manual editing.")}
                  className="py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[8px] uppercase tracking-wider text-center transition-all"
                >
                  Edit Draft
                </button>
                <button
                  onClick={() => setFirStatusText("Submitted to Noida Judicial Magistrate.")}
                  className="py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[8px] uppercase tracking-wider text-center transition-all"
                >
                  Submit
                </button>
              </div>
            )}
          </div>

          {/* Blockchain Evidence Vault */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <Shield className="text-emerald-400" size={14} /> 🔒 Evidence Vault
              </h3>
              <span className="text-[7px] font-mono px-1.5 py-0.5 rounded font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                SECURED
              </span>
            </div>

            <div className="space-y-1.5">
              {[
                { name: "Audio Logs (VoiceShield)", hash: "0x3f2a...8c1f", time: "22:52 PM" },
                { name: "GPS Track Logs", hash: "0x7e4a...3b3f", time: "22:53 PM" },
                { name: "Incident Timeline Logs", hash: "0x1a8c...9e4a", time: "22:55 PM" },
                { name: "Route History Ledger", hash: "0x5d9e...1b3f", time: "22:58 PM" }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-black/40 border border-white/5 text-[9px] font-mono">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white/80">{item.name}</div>
                    <div className="text-white/30 text-[7px] flex items-center gap-1">
                      <span>Hash: {item.hash}</span>
                      <span>·</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                  <span className="text-[7px] px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase shrink-0">
                    VERIFIED
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Crime trends predictive bottom overview */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="rounded-2xl border border-white/5 bg-[#0a0a0f]/90 p-5 space-y-3 shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-cyan-400" /> Predictive Hotspot Analysis
          </h3>
          <CrimeChart data={crimeTrends} />
        </div>
      </div>

      {/* Login Gate Overlay */}
      {!isAuthenticated && (
        <div className="fixed inset-0 z-50 bg-[#050508]/98 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0a0f]/90 border border-white/10 p-8 rounded-3xl space-y-6 shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <Shield className="text-purple-400 animate-pulse" size={28} />
              </div>
              <h2 className="text-lg font-black tracking-wide text-white uppercase mt-4">
                🔒 Police Command Access
              </h2>
              <p className="text-xs text-white/40">
                Restricted to verified law enforcement and police personnel.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!otpSent) {
                  setOtpSent(true);
                } else {
                  setIsVerifying(true);
                  setTimeout(() => {
                    setIsVerifying(false);
                    setIsAuthenticated(true);
                  }, 1500);
                }
              }}
              className="space-y-4"
            >
              {!otpSent ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-white/40 font-mono block uppercase">Officer ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. POL-62847"
                      value={officerId}
                      onChange={(e) => setOfficerId(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-white/40 font-mono block uppercase">Badge Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 7847-UP-NCR"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-white/40 font-mono block uppercase">OTP Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:border-purple-500 outline-none tracking-widest text-center font-mono transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-400 font-mono text-center">
                    ✓ Secure OTP sent to registered officer phone number.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-800 disabled:to-indigo-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying Credentials...
                  </>
                ) : !otpSent ? (
                  "Request Access"
                ) : (
                  "Verify & Log In"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
