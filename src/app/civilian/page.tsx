"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Shield, ArrowLeft, Cpu, Monitor, Phone, Info, Radio } from "lucide-react";
import { MobileDeviceFrame } from "@/components/civilian/MobileDeviceFrame";
import { HomeTab } from "@/components/civilian/HomeTab";
import { MapTab } from "@/components/civilian/MapTab";
import { CommunityTab } from "@/components/civilian/CommunityTab";
import { JourneyTab } from "@/components/civilian/JourneyTab";
import { ProfileTab } from "@/components/civilian/ProfileTab";
import { SOSSimulation } from "@/components/civilian/SOSSimulation";
import { useTravelSafeStore } from "@/store/useTravelSafeStore";
import { useMockStreams } from "@/hooks/useMockStreams";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import { ResponderStatusPanel } from "@/components/tracking/ResponderStatusPanel";
import { isTrackingActive } from "@/lib/tracking";

const LiveTrackingMap = dynamic(() => import("@/components/tracking/LiveTrackingMap"), { ssr: false });

export default function CivilianPage() {
  useMockStreams();
  const { startDemo, stopDemo, snapshot, connected } = useLiveTracking();
  const [activeTab, setActiveTab] = useState("home");
  const systemMode = useTravelSafeStore((s) => s.systemMode);
  const startThreatSimulation = useTravelSafeStore((s) => s.startThreatSimulation);
  const stopThreatSimulation = useTravelSafeStore((s) => s.stopThreatSimulation);
  const isAuthenticated = useTravelSafeStore((s) => s.isAuthenticated);

  const isEmergency = systemMode !== "SAFE";
  const trackingActive = isTrackingActive(snapshot);

  const handleSimulateEmergency = () => {
    if (isEmergency) {
      stopThreatSimulation();
      stopDemo();
    } else {
      startThreatSimulation();
      startDemo();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />;
      case "map":
        return <MapTab />;
      case "community":
        return <CommunityTab />;
      case "journey":
        return <JourneyTab onTriggerSilentSos={startThreatSimulation} />;
      case "profile":
        return <ProfileTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${isEmergency ? "grid-bg-emergency bg-[#0d0404]" : "grid-bg bg-[#050508]"} transition-colors duration-1000`}>
      {/* Decorative background grid and flares */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[150px] transition-all duration-1000 ${isEmergency ? "bg-red-500/5" : "bg-emerald-500/3"}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] transition-all duration-1000 ${isEmergency ? "bg-orange-500/5" : "bg-cyan-500/3"}`} />
      </div>

      {/* Header bar for Web Preview */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isEmergency ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
              <Shield size={14} className={isEmergency ? "text-red-400" : "text-emerald-400"} />
            </div>
            <span className="text-xs font-bold font-[family-name:var(--font-display)] text-white/95">
              TravelSafe X <span className="text-white/40">· Civilian Mobile Simulator</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/command"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all uppercase tracking-wider"
          >
            <Monitor size={12} /> Command Center
          </Link>
        </div>
      </nav>

      {/* Simulator Grid */}
      <div className="max-w-6xl mx-auto pt-20 px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[90vh]">
        {/* Left Column: Context & Interactive Developer Controls */}
        <div className="col-span-12 lg:col-span-7 space-y-6 pt-6">
          <div className="space-y-2.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isEmergency ? "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}>
              {isEmergency ? "Emergency Active" : "Dual-Sync Sandbox Mode"}
            </span>
            
            <h1 className="text-4xl md:text-5xl font-extrabold font-[family-name:var(--font-display)] tracking-tight text-white leading-none">
              Civilian Companion <br />
              <span className={isEmergency ? "text-red-400" : "text-emerald-400"}>Safety Simulator</span>
            </h1>
            
            <p className="text-sm text-white/40 max-w-lg leading-relaxed">
              Experience the platform from the perspective of an urban commuter. The mobile app synchronizes coordinates, kinematic AI alerts, and blockchain ledgers in real-time with the military-grade command center.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-[11px] text-orange-400/90 leading-relaxed max-w-xl">
              ⚠️ **Sandbox Demo Mode** — Aadhaar credentials not verified. Please launch from the Unified Entry Screen to complete biometric authentication and link your trust profile.
            </div>
          )}

          {/* Developer Sandbox Controls */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 space-y-4 max-w-xl">
            <h3 className="text-xs font-bold tracking-wider text-white/70 uppercase flex items-center gap-2">
              <Cpu size={14} className="text-emerald-400" /> Developer Sandbox Controls
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleSimulateEmergency}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                  isEmergency
                    ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                    : "bg-gradient-to-r from-red-600 to-orange-600 border border-red-500/20 text-white hover:glow-crimson"
                }`}
              >
                <Phone size={12} />
                {isEmergency ? "End Emergency SOS" : "Simulate Emergency"}
              </button>
              
              <Link
                href="/command"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 text-xs font-bold tracking-wider uppercase transition-all"
              >
                <Monitor size={12} />
                Inspect Command Center
              </Link>
            </div>

            <div className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-2">
              <h4 className="text-[10px] font-bold text-white/50 flex items-center gap-1">
                <Info size={12} className="text-cyan-400" /> Interactive Workflows to Test:
              </h4>
              <ul className="text-[10px] text-white/40 space-y-1 list-disc pl-4">
                <li>Click <span className="text-white/60">&quot;Simulate Emergency&quot;</span> to trigger the full 10-step live tracking demo (Guardian accept → Police dispatch → live ETA).</li>
                <li>Go to the <span className="text-white/60">Journey Tab</span> and type <span className="font-mono text-cyan-400">&quot;Aunt Mary called.&quot;</span> into the simulated chat to trigger a stealth Silent SOS.</li>
                <li>Go to the <span className="text-white/60">Map Tab</span> to see live responder movement on the map.</li>
              </ul>
            </div>
          </div>

          {/* Live Responder Tracking Panel */}
          {(isEmergency || trackingActive) && (
            <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-5 space-y-4 max-w-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-wider text-red-400 uppercase flex items-center gap-2">
                  <Radio size={14} className={connected ? "animate-pulse" : ""} />
                  Live Responder Tracking
                </h3>
                <span className="text-[8px] font-mono text-white/30">
                  {connected ? "WebSocket Connected" : "Connecting..."}
                </span>
              </div>
              <div className="h-44 rounded-xl overflow-hidden border border-white/5">
                <LiveTrackingMap snapshot={snapshot} viewMode="civilian" height="176px" showLegend={false} showProgress={false} />
              </div>
              <ResponderStatusPanel snapshot={snapshot} variant="civilian" compact />
            </div>
          )}
        </div>

        {/* Right Column: Mobile Simulator Device Frame */}
        <div className="col-span-12 lg:col-span-5 flex justify-center">
          <div className="relative">
            <MobileDeviceFrame
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onSosClick={isEmergency ? stopThreatSimulation : startThreatSimulation}
            >
              {renderTabContent()}
              <SOSSimulation />
            </MobileDeviceFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
