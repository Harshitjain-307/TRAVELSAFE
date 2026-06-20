"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Globe, Camera } from "lucide-react";
import { useTravelSafeStore } from "@/store/useTravelSafeStore";
import { useMockStreams } from "@/hooks/useMockStreams";
import dynamic from "next/dynamic";

const SafetyChart = dynamic(() => import("@/components/admin/SafetyChart"), {
  ssr: false,
});

export default function AdminPage() {
  useMockStreams(); // Start streams

  // Zustand State
  const systemMode = useTravelSafeStore((s) => s.systemMode);
  const metrics = useTravelSafeStore((s) => s.metrics);
  const smartCityCctvActive = useTravelSafeStore((s) => s.smartCityCctvActive);
  const toggleCctv = useTravelSafeStore((s) => s.toggleCctv);
  const aadhaarQueue = useTravelSafeStore((s) => s.aadhaarQueue);
  const approveAadhaarAccount = useTravelSafeStore((s) => s.approveAadhaarAccount);

  const isEmergency = systemMode !== "SAFE";

  // Local state
  const [activeTab, setActiveTab] = useState<"cctv" | "feed" | "approvals" | "analytics">("cctv");

  // Admin login states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Animated counters
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalGuardians, setTotalGuardians] = useState(0);
  const [activeJourneys, setActiveJourneys] = useState(0);
  const [activeEmergencies, setActiveEmergencies] = useState(0);
  const [resolvedIncidents, setResolvedIncidents] = useState(0);
  const [onlinePolice, setOnlinePolice] = useState(0);

  // Animated counters effect
  useEffect(() => {
    if (!isAuthenticated) return;

    const targets = {
      users: 12847,
      guardians: 847,
      journeys: 24,
      emergencies: isEmergency ? 1 : 0,
      resolved: 156,
      police: 42
    };

    let start = 0;
    const duration = 1500;
    const stepTime = 30;
    const steps = duration / stepTime;
    
    const timer = setInterval(() => {
      start += 1;
      const progress = start / steps;
      if (progress >= 1) {
        setTotalUsers(targets.users);
        setTotalGuardians(targets.guardians);
        setActiveJourneys(targets.journeys);
        setActiveEmergencies(targets.emergencies);
        setResolvedIncidents(targets.resolved);
        setOnlinePolice(targets.police);
        clearInterval(timer);
      } else {
        setTotalUsers(Math.floor(targets.users * progress));
        setTotalGuardians(Math.floor(targets.guardians * progress));
        setActiveJourneys(Math.floor(targets.journeys * progress));
        setActiveEmergencies(Math.floor(targets.emergencies * progress));
        setResolvedIncidents(Math.floor(targets.resolved * progress));
        setOnlinePolice(Math.floor(targets.police * progress));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isAuthenticated, isEmergency]);

  // Chart data: Safety index comparison by city
  const citySafetyData = [
    { city: "Delhi NCR", score: metrics.luminaScore, activeResponders: 847 },
    { city: "Mumbai", score: 94, activeResponders: 1240 },
    { city: "Bangalore", score: 96, activeResponders: 1050 },
    { city: "Kolkata", score: 85, activeResponders: 600 },
  ];

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
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isEmergency ? "bg-red-500/20" : "bg-orange-500/20"}`}>
              <Shield size={14} className={isEmergency ? "text-red-400" : "text-orange-400"} />
            </div>
            <span className="text-xs font-bold font-[family-name:var(--font-display)] text-white/95">
              TravelSafe X <span className="text-white/40">· National Control Tower</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <span className="text-[10px] px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-[9px] font-bold uppercase tracking-wider mr-2">
              ROLE: Super Admin
            </span>
          )}
          <span className="text-[10px] px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-[9px] font-bold">
            SECURITY RANK: NATIONAL ADMIN
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
        </div>
      </nav>

      {/* Grid Dashboard */}
      <div className="max-w-6xl mx-auto pt-20 px-4 grid grid-cols-12 gap-4 pb-10">
        
        {/* Left Side: National Command Dashboard & comparative grid */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          
          {/* Counters Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total Users", val: totalUsers.toLocaleString(), color: "text-purple-400" },
              { label: "Guardians Online", val: totalGuardians.toLocaleString(), color: "text-emerald-400" },
              { label: "Active Journeys", val: activeJourneys.toLocaleString(), color: "text-cyan-400" },
              { label: "Active Emergencies", val: activeEmergencies.toLocaleString(), color: "text-red-400 animate-pulse" },
              { label: "Resolved Incidents", val: resolvedIncidents.toLocaleString(), color: "text-teal-400" },
              { label: "Police Online", val: onlinePolice.toLocaleString(), color: "text-blue-400" }
            ].map((stat, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-white/5 bg-white/[0.01] text-center font-mono space-y-0.5">
                <span className="text-[7px] text-white/30 block uppercase font-bold">{stat.label}</span>
                <span className={`text-sm font-black block ${stat.color}`}>{stat.val}</span>
              </div>
            ))}
          </div>

          {/* City Safety Grid */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md p-4 space-y-4">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Globe size={14} className="text-orange-400" /> National Safety Twin™
            </h3>

            <div className="space-y-3">
              {citySafetyData.map((item) => {
                const isDelhi = item.city === "Delhi NCR";
                return (
                  <div
                    key={item.city}
                    className={`p-3 rounded-xl border ${
                      isDelhi && isEmergency
                        ? "border-red-500/30 bg-red-500/5 text-red-400 animate-pulse"
                        : "border-white/5 bg-white/[0.02]"
                    } flex items-center justify-between`}
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-white/95">{item.city}</h4>
                      <span className="text-[8px] text-white/30 uppercase block mt-0.5 font-mono">
                        {item.activeResponders} active nodes
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`text-lg font-bold ${
                        item.score >= 90
                          ? "text-emerald-400"
                          : item.score >= 70
                            ? "text-cyan-400"
                            : "text-red-400"
                      }`}>
                        {item.score}%
                      </span>
                      <span className="text-[8px] text-white/30 block uppercase">Safety</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Tab Portals */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Header tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("cctv")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                activeTab === "cctv"
                  ? "bg-orange-500/10 border-orange-500/35 text-orange-400"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              Smart City CCTV Feeds
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                activeTab === "feed"
                  ? "bg-orange-500/10 border-orange-500/35 text-orange-400"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              Incident Feed
            </button>
            <button
              onClick={() => setActiveTab("approvals")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                activeTab === "approvals"
                  ? "bg-orange-500/10 border-orange-500/35 text-orange-400"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              Aadhaar Approvals Queue
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                activeTab === "analytics"
                  ? "bg-orange-500/10 border-orange-500/35 text-orange-400"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              Analytics Center
            </button>
          </div>

          {activeTab === "cctv" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4 font-mono">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <Camera size={14} className="text-orange-400" /> AI Pedestrian tracking CCTV Grid
                  </h4>
                  <button
                    onClick={toggleCctv}
                    className={`text-[9px] px-2 py-0.5 rounded font-bold border transition-colors ${
                      smartCityCctvActive
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}
                  >
                    {smartCityCctvActive ? "FEED ACTIVE" : "FEED MUTED"}
                  </button>
                </div>

                {/* CCTV grid layout */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { cam: "CAM-01 CP Radial Road 4", target: "Pedestrian Flow: Normal" },
                    { cam: "CAM-02 CP Sector 7-G", target: isEmergency ? "PEDESTRIAN DISTURBANCE DETECTED" : "Pedestrian Flow: Normal" },
                    { cam: "CAM-03 Noida Sec 62 Underpass", target: "Camera Online: Safe" },
                    { cam: "CAM-04 DND Flyway Toll Plaza", target: "Vehicle Tracking Enabled" },
                    { cam: "CAM-05 Karol Bagh Main Market", target: "Pedestrian Flow: Busy" },
                    { cam: "CAM-06 Saket Metro Exit B", target: "Camera Online: Safe" }
                  ].map((cctv, idx) => (
                    <div
                      key={idx}
                      className="relative h-28 rounded-xl bg-black/60 border border-white/5 overflow-hidden flex flex-col justify-between p-2"
                    >
                      <div className="flex items-center justify-between text-[7px] font-mono text-white/40">
                        <span className="truncate max-w-[80%]">{cctv.cam}</span>
                        <span className="text-emerald-400 animate-pulse shrink-0">● LIVE</span>
                      </div>
                      
                      {smartCityCctvActive ? (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          {/* Bounding box mock drawing */}
                          <div className={`relative w-10 h-10 border-2 rounded ${
                            isEmergency && idx === 1 ? "border-red-500 animate-pulse" : "border-emerald-400"
                          }`}>
                            <span className="absolute -top-3.5 left-0 text-[5px] font-mono bg-black/80 px-1 rounded">
                              {isEmergency && idx === 1 ? "TARGET #49" : "HUMAN #12"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-[8px] text-white/20 italic my-auto">Feed Deactivated</div>
                      )}

                      <span className="text-[6.5px] text-white/30 uppercase tracking-widest font-mono select-none truncate">
                        {cctv.target}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Camera Health Row */}
                <div className="border-t border-white/5 pt-3 mt-1">
                  <span className="text-[8px] uppercase tracking-wider text-white/40 font-sans font-bold block mb-2">Camera Infrastructure Uptime Health</span>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { label: "CAM-01", uptime: "99.8%" },
                      { label: "CAM-02", uptime: "99.9%" },
                      { label: "CAM-03", uptime: "99.4%" },
                      { label: "CAM-04", uptime: "99.9%" },
                      { label: "CAM-05", uptime: "98.7%" },
                      { label: "CAM-06", uptime: "99.5%" }
                    ].map((cam, idx) => (
                      <div key={idx} className="bg-white/[0.02] border border-white/5 rounded p-1.5 text-center font-mono text-[7px]">
                        <div className="flex items-center justify-center gap-0.5 mb-0.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-white/60 font-bold">{cam.label}</span>
                        </div>
                        <span className="text-white/30">{cam.uptime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "feed" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  ⚠️ Live Incident Monitoring Feed
                </h4>

                <div className="space-y-3 font-mono text-[9px]">
                  {[
                    {
                      id: "INC-948",
                      type: "audio_panic",
                      location: "Noida Sector 63, Junction 4",
                      time: "22:52 PM",
                      severity: "CRITICAL",
                      status: isEmergency ? "ACTIVE (PROPAGATING)" : "RESOLVED",
                      desc: "High distress screaming matched with kinematic snatch pattern."
                    },
                    {
                      id: "INC-945",
                      type: "manual_sos",
                      location: "Connaught Place Radial Rd 3",
                      time: "22:15 PM",
                      severity: "HIGH",
                      status: "RESOLVED",
                      desc: "User initiated manual distress SOS signal."
                    },
                    {
                      id: "INC-942",
                      type: "snatch",
                      location: "Noida Sector 62 Underpass",
                      time: "21:40 PM",
                      severity: "MEDIUM",
                      status: "RESOLVED",
                      desc: "AI G-sensor kinematic grab event registered."
                    },
                    {
                      id: "INC-940",
                      type: "audio_panic",
                      location: "Karol Bagh Main Market",
                      time: "20:05 PM",
                      severity: "MEDIUM",
                      status: "RESOLVED",
                      desc: "Distress voice keywords matches: 'Help me' detected."
                    }
                  ].map((inc, idx) => {
                    const isActive = idx === 0 && isEmergency;
                    const sevColor = inc.severity === "CRITICAL" ? "text-red-400 bg-red-500/10 border-red-500/20" : inc.severity === "HIGH" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
                    return (
                      <div
                        key={inc.id}
                        className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                          isActive
                            ? "border-red-500/40 bg-red-500/5 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse"
                            : "border-white/5 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className={`w-2 h-2 rounded-full mt-1 ${isActive ? "bg-red-500 animate-ping" : inc.status === "RESOLVED" ? "bg-emerald-500" : "bg-orange-500"}`} />
                          <span className="w-px h-12 bg-white/10 mt-1" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-bold">{inc.id} · {inc.type.replace("_", " ").toUpperCase()}</span>
                            <span className="text-white/30 text-[8px]">{inc.time}</span>
                          </div>
                          <p className="text-white/60">{inc.desc}</p>
                          <div className="flex gap-2 pt-1">
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase ${sevColor}`}>
                              {inc.severity}
                            </span>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase bg-black/40 border-white/5 text-white/50`}>
                              {inc.location}
                            </span>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase ${isActive ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"}`}>
                              {inc.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "approvals" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Pending Credentials Verifications Queue
                </h4>
                
                <div className="space-y-2.5">
                  {aadhaarQueue.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 text-[10px] font-bold">
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="font-semibold text-white/80">{item.name}</h5>
                          <p className="text-[9px] text-white/30">Request Role: {item.role} · Aadhaar linked</p>
                        </div>
                      </div>
                      
                      {item.approved ? (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                          APPROVED
                        </span>
                      ) : (
                        <button
                          onClick={() => approveAadhaarAccount(item.id)}
                          className="text-[9px] px-3 py-1 rounded bg-orange-500/10 border border-orange-500/25 text-orange-400 font-bold hover:bg-orange-500/20"
                        >
                          APPROVE
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-4 font-mono">
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                  Operational Safety Coverage Index
                </h4>
                
                <SafetyChart data={citySafetyData} />

                {/* Enhanced analytics stat cards */}
                <div className="border-t border-white/5 pt-4 mt-2">
                  <span className="text-[8px] uppercase tracking-wider text-white/40 font-sans font-bold block mb-2">Command Operations Key Performance Indicators</span>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: "Daily Emergencies", val: "3", desc: "▲ +1 vs yesterday (high alert)", color: "text-red-400" },
                      { label: "Monthly Trend", val: "↓ 12%", desc: "▼ Decreased crime reports", color: "text-emerald-400" },
                      { label: "Avg Response Time", val: "4.2 min", desc: "✓ Within SLA (Target 5m)", color: "text-cyan-400" },
                      { label: "Police Coverage", val: "94%", desc: "✓ Sector Noida/Delhi Active", color: "text-purple-400" }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 font-mono space-y-1">
                        <span className="text-[7px] text-white/30 block uppercase font-bold">{stat.label}</span>
                        <span className={`text-base font-black block ${stat.color}`}>{stat.val}</span>
                        <span className="text-[6.5px] text-white/40 block mt-0.5 leading-none">{stat.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login Gate Overlay */}
      {!isAuthenticated && (
        <div className="fixed inset-0 z-50 bg-[#050508]/98 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0a0f]/90 border border-white/10 p-8 rounded-3xl space-y-6 shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                <Shield className="text-orange-400 animate-pulse" size={28} />
              </div>
              <h2 className="text-lg font-black tracking-wide text-white uppercase mt-4">
                🏛 Admin Control Tower
              </h2>
              <p className="text-xs text-white/40">
                National Security Operations Center Restricted Access
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsVerifying(true);
                setTimeout(() => {
                  setIsVerifying(false);
                  setIsAuthenticated(true);
                }, 1500);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 font-mono block uppercase">Admin Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:border-orange-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 font-mono block uppercase">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:border-orange-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 font-mono block uppercase">OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:border-orange-500 outline-none tracking-widest text-center font-mono transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-orange-800 disabled:to-amber-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating Security Token...
                  </>
                ) : (
                  "Verify & Access Control Tower"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
