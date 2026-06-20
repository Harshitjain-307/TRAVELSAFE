"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Lock, Shield, ShieldCheck, Car, Footprints, Bike, Bus } from "lucide-react";
import { useTravelSafeStore } from "@/store/useTravelSafeStore";

interface JourneyTabProps {
  onTriggerSilentSos: () => void;
}

export function JourneyTab({ onTriggerSilentSos }: JourneyTabProps) {
  const systemMode = useTravelSafeStore((s) => s.systemMode);
  const isEmergency = systemMode !== "SAFE";

  // V2 Journey States
  const [isJourneyActive, setIsJourneyActive] = useState(false);
  const [transportMode, setTransportMode] = useState<"walking" | "bike" | "personal" | "cab" | "public" | null>(null);

  // Cab Input fields
  const [cabNumber, setCabNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [cabService, setCabService] = useState("");
  const [tripId, setTripId] = useState("");

  // Personal Car / Bike Input fields
  const [vehicleNumber, setVehicleNumber] = useState("");

  // Chat log states
  const [safeWords] = useState(["Aunt Mary called.", "I forgot my blue file."]);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: "user" | "other"; text: string }[]>([
    { sender: "other", text: "Hey! Let know when you reach CP." },
    { sender: "user", text: "Sure, just got in the cab." },
  ]);

  // AI Companion Chat states
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiChatLog, setAiChatLog] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Welcome to Ride AI Companion. I will assist you with route safety, lighting quality, and safe havens." },
  ]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    const newLog = [...chatLog, { sender: "user" as const, text: msg }];
    setChatLog(newLog);
    setChatInput("");

    const matches = safeWords.some((word) => {
      const cleanWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
      const cleanMsg = msg.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
      return cleanMsg.includes(cleanWord);
    });

    if (matches) {
      setTimeout(() => {
        setChatLog((prev) => [...prev, { sender: "other" as const, text: "System Alert: Silent SOS Initiated." }]);
        onTriggerSilentSos();
      }, 800);
    }
  };

  const handleAskAi = (query: string) => {
    if (isAiTyping) return;
    
    setAiChatLog((prev) => [...prev, { sender: "user", text: query }]);
    setIsAiTyping(true);

    // AI typing simulation
    setTimeout(() => {
      let aiText = "Evaluating current coordinates... Path appears secure. Please stay on well-lit lanes.";
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes("haven") || lowerQuery.includes("safe")) {
        aiText = "📍 Route Analysis: There are 3 Verified Safe Havens nearby. 1. Police Station (350m, Northwest), 2. SafeZone Metro Booth (600m), 3. 24/7 Superstore (900m). Route navigation to any haven is armed.";
      } else if (lowerQuery.includes("light") || lowerQuery.includes("coverage")) {
        aiText = "💡 Light Analysis: Average route luminosity is 87%. Next 400m has optimal lighting. Caution: minor low-light segment detected at sector crossing; remain on central walkways.";
      } else if (lowerQuery.includes("score") || lowerQuery.includes("rating") || lowerQuery.includes("safety")) {
        aiText = "🛡️ Safety Rating: 92/100. Crime index is very low in this grid today. 4 other TravelSafe members active in a 1km radius.";
      } else if (lowerQuery.includes("hello") || lowerQuery.includes("hi")) {
        aiText = "Hello! I am monitoring your journey parameters in real-time. Ask me about light coverage, safe havens, or safety ratings.";
      }

      setAiChatLog((prev) => [...prev, { sender: "ai", text: aiText }]);
      setIsAiTyping(false);
    }, 800);
  };

  const handleSendAiMessage = () => {
    if (!aiInput.trim()) return;
    const query = aiInput.trim();
    setAiInput("");
    handleAskAi(query);
  };

  const startTrip = () => {
    if (transportMode === "cab" && (!cabNumber || !driverName || !cabService || !tripId)) {
      alert("Please fill out all cab details to start a protected trip.");
      return;
    }
    if ((transportMode === "personal" || transportMode === "bike") && !vehicleNumber.trim()) {
      alert("Please enter your vehicle number to start a protected trip.");
      return;
    }
    setIsJourneyActive(true);
  };

  const endTrip = () => {
    setIsJourneyActive(false);
    setTransportMode(null);
    setCabNumber("");
    setDriverName("");
    setCabService("");
    setTripId("");
    setVehicleNumber("");
    setAiChatLog([
      { sender: "ai", text: "Welcome to Ride AI Companion. I will assist you with route safety, lighting quality, and safe havens." }
    ]);
  };

  const journeySteps = [
    { label: "Journey Started", location: "Noida Sector 62", time: "09:40 AM", done: true },
    { label: "Checkpoint 1 Reached", location: "Noida Sector 62 metro junction", time: "09:43 AM", done: true },
    { label: "Active Tracking", location: "Live road vectors sync", time: "Live", done: !isEmergency, active: !isEmergency },
    { label: "Destination Arrival", location: "Noida Sector 63 Hub", time: "ETA 09:55 AM", done: false },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* 1. EMPTY STATE - No Active Journey */}
      {!isJourneyActive && (
        <div className="space-y-4">
          <div className="text-center py-6 border border-white/5 bg-white/[0.01] rounded-2xl p-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">No active journey</h4>
              <p className="text-[9px] text-white/40 mt-1 max-w-[200px] mx-auto">
                Select your transport mode to start a protected trip.
              </p>
            </div>
          </div>

          {/* Transport Mode Selector */}
          <div className="space-y-2">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block font-bold">Travelling By?</span>
            <div className="grid grid-cols-5 gap-1 text-[8px] font-bold">
              {[
                { id: "walking" as const, label: "Walk", icon: <Footprints size={12} /> },
                { id: "bike" as const, label: "Bike", icon: <Bike size={12} /> },
                { id: "personal" as const, label: "Car", icon: <Car size={12} /> },
                { id: "cab" as const, label: "Cab", icon: <Car className="text-yellow-400" size={12} /> },
                { id: "public" as const, label: "Transit", icon: <Bus size={12} /> }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setTransportMode(mode.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    transportMode === mode.id
                      ? "border-cyan-500/35 bg-cyan-500/10 text-cyan-400"
                      : "border-white/5 bg-white/[0.01] text-white/55"
                  }`}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cab details form */}
          {transportMode === "cab" && (
            <div className="rounded-xl border border-white/5 bg-black/40 p-3 space-y-2 text-xs">
              <span className="text-[9px] uppercase tracking-wider text-yellow-400 font-bold block mb-1">Enter Cab Details</span>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Cab Number Plate (e.g. DL 1C A 1234)"
                  value={cabNumber}
                  onChange={(e) => setCabNumber(e.target.value)}
                  className="w-full bg-black/50 border border-white/5 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-white/30 outline-none focus:border-yellow-500/40"
                />
                <input
                  type="text"
                  placeholder="Driver Name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-black/50 border border-white/5 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-white/30 outline-none focus:border-yellow-500/40"
                />
                <input
                  type="text"
                  placeholder="Cab Service (e.g. Uber, Ola)"
                  value={cabService}
                  onChange={(e) => setCabService(e.target.value)}
                  className="w-full bg-black/50 border border-white/5 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-white/30 outline-none focus:border-yellow-500/40"
                />
                <input
                  type="text"
                  placeholder="Trip ID / Booking Ref"
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  className="w-full bg-black/50 border border-white/5 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-white/30 outline-none focus:border-yellow-500/40"
                />
              </div>
            </div>
          )}

          {/* Vehicle details form (Personal Car / Bike) */}
          {(transportMode === "personal" || transportMode === "bike") && (
            <div className="rounded-xl border border-white/5 bg-black/40 p-3 space-y-2 text-xs">
              <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold block mb-1">Enter Vehicle Details</span>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Vehicle Number Plate (e.g. DL 1C A 1234)"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-black/50 border border-white/5 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          )}

          {transportMode && (
            <button
              onClick={startTrip}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-xs font-bold uppercase tracking-wider hover:from-emerald-500 hover:to-emerald-600 transition-all text-white"
            >
              Start Safe Trip
            </button>
          )}
        </div>
      )}

      {/* 2. ACTIVE JOURNEY DASHBOARD */}
      {isJourneyActive && (
        <div className="space-y-4">
          
          {/* Guardian Auto-Share Confirmation Card */}
          <div className="rounded-xl border border-emerald-500 bg-emerald-950/20 p-3 space-y-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden animate-pulse">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                Guardian Auto-Share Active
              </span>
            </div>
            <p className="text-[9px] text-emerald-300/80 leading-relaxed font-sans">
              Your real-time GPS coordinates, audio stream, and vehicle telemetry are now being shared with 3 designated emergency guardians.
            </p>
          </div>

          {/* Reassurance panel */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2 text-center relative overflow-hidden">
            <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1 uppercase tracking-wider">
              <ShieldCheck size={14} className="animate-pulse" /> 🛡️ You Are Protected
            </span>
            
            <div className="grid grid-cols-4 gap-1 border-t border-white/5 pt-2.5 text-[8px] font-mono text-white/55">
              <div>
                <span className="block text-[7px] text-white/30 uppercase">Guardians</span>
                <span className="text-white font-bold">3 Nearby</span>
              </div>
              <div>
                <span className="block text-[7px] text-white/30 uppercase">Co-Travellers</span>
                <span className="text-white font-bold">5 Online</span>
              </div>
              <div>
                <span className="block text-[7px] text-white/30 uppercase">Safe Haven</span>
                <span className="text-cyan-400 font-bold">400m</span>
              </div>
              <div>
                <span className="block text-[7px] text-white/30 uppercase">Safety Score</span>
                <span className="text-emerald-400 font-bold">92/100</span>
              </div>
            </div>
          </div>

          {/* Cab Specific Monitoring Badges */}
          {transportMode === "cab" && (
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 text-[9px] font-mono">
              <div className="flex justify-between items-center text-yellow-400 font-bold">
                <span>🚕 CAB TRIP IN PROGRESS</span>
                <span className="text-emerald-400 animate-pulse text-[8px]">✓ TRIP PROTECTED</span>
              </div>
              <div className="text-white/50 space-y-0.5 text-[8px]">
                <div>Cab: <span className="text-white font-bold">{cabNumber}</span> ({cabService})</div>
                <div>Driver: <span className="text-white font-bold">{driverName}</span></div>
                <div>Trip ID: <span className="text-white font-bold">{tripId}</span></div>
              </div>
              <div className="border-t border-white/5 pt-1.5 flex justify-between text-[7px] text-white/40">
                <span>🛡️ GUARDIAN MONITORING ACTIVE</span>
                <span>🚨 EMERGENCY READY</span>
              </div>
            </div>
          )}

          {/* Vehicle Specific Monitoring Badges (Personal Car / Bike) */}
          {(transportMode === "personal" || transportMode === "bike") && (
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 text-[9px] font-mono">
              <div className="flex justify-between items-center text-cyan-400 font-bold">
                <span>{transportMode === "personal" ? "🚗 PERSONAL CAR TRIP" : "🏍️ BIKE TRIP"}</span>
                <span className="text-emerald-400 animate-pulse text-[8px]">✓ VEHICLE WATCH ACTIVE</span>
              </div>
              <div className="text-white/50 space-y-0.5 text-[8px]">
                <div>Vehicle Number: <span className="text-white font-bold">{vehicleNumber}</span></div>
              </div>
              <div className="border-t border-white/5 pt-1.5 flex justify-between text-[7px] text-white/40">
                <span>🛡️ RADAR DISPATCH ON DURESS</span>
                <span>🚨 EMERGENCY READY</span>
              </div>
            </div>
          )}

          {/* Active Trip Tracker */}
          <div className="space-y-2">
            <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <MapPin size={10} className="text-emerald-400" /> Active Journey Tracker
            </h3>
            
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl relative">
              <div className="absolute left-[26px] top-6 bottom-6 w-0.5 bg-white/5" />
              
              <div className="space-y-4">
                {journeySteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4 pl-3 relative">
                    {step.active ? (
                      <motion.div
                        className="absolute left-1 w-3 h-3 rounded-full bg-cyan-400 z-10"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    ) : (
                      <div className={`absolute left-1 w-3 h-3 rounded-full z-10 border ${
                        step.done
                          ? isEmergency
                            ? "bg-red-500 border-red-500"
                            : "bg-emerald-500 border-emerald-500"
                            : "bg-[#07070a] border-white/10"
                      }`} />
                    )}
                    
                    <div className="flex-1 flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-semibold text-white/80">{step.label}</h4>
                        <p className="text-[9px] text-white/30">{step.location}</p>
                      </div>
                      <span className="text-[8px] font-mono text-white/40">{step.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ride AI Companion Chat Window */}
          <div className="space-y-2">
            <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <span>🤖</span> Ride AI Companion
            </h3>

            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
              {/* Seeded Tip Bubbles */}
              <div className="space-y-1">
                <span className="text-[8px] uppercase tracking-wider text-white/40 font-bold block">Quick Safety Checks:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "📍 Safe Havens Nearby", query: "Show safe havens near my route" },
                    { label: "💡 Light Coverage", query: "What is the street light coverage ahead?" },
                    { label: "🛡️ Route Safety Score", query: "Check safety rating of this path" },
                  ].map((tip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskAi(tip.query)}
                      className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-[8px] text-cyan-300 hover:bg-cyan-500/20 transition-all font-semibold"
                    >
                      {tip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Interface */}
              <div className="border border-white/5 rounded-xl bg-black/40 overflow-hidden">
                <div className="bg-white/[0.02] border-b border-white/5 px-2 py-1.5 flex items-center justify-between text-[8px] text-white/30 font-mono">
                  <span>AI SAFETY STREAM</span>
                  <span className="text-cyan-400">ONLINE</span>
                </div>

                <div className="p-2 space-y-1.5 max-h-28 overflow-y-auto font-sans">
                  {aiChatLog.map((log, i) => (
                    <div key={i} className={`flex ${log.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`px-2.5 py-1.5 rounded-lg text-[9px] max-w-[85%] leading-normal ${
                        log.sender === "user" 
                          ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/10" 
                          : "bg-white/5 text-white/80 border border-white/5"
                      }`}>
                        {log.text}
                      </div>
                    </div>
                  ))}
                  {isAiTyping && (
                    <div className="flex justify-start">
                      <div className="px-2.5 py-1.5 rounded-lg text-[9px] bg-white/5 text-white/40 border border-white/5 animate-pulse">
                        AI is typing...
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Input bar */}
                <div className="border-t border-white/5 p-1.5 flex gap-1 bg-black/20">
                  <input
                    type="text"
                    placeholder="Ask AI Guardian..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendAiMessage()}
                    className="bg-transparent text-[9px] text-white outline-none w-full px-1.5"
                  />
                  <button
                    onClick={handleSendAiMessage}
                    className="bg-cyan-500/20 border border-cyan-400/20 text-cyan-400 text-[8px] px-2 py-1 rounded font-semibold hover:bg-cyan-500/30 transition-all"
                  >
                    Ask
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stealth Safe-Words Engine */}
          <div className="space-y-2">
            <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Lock size={10} className="text-emerald-400" /> Stealth Safe-Words Engine
            </h3>

            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
              <p className="text-[8px] text-white/40 leading-relaxed">
                Configure words that trigger a **Silent SOS** when typed into a standard chat dialog:
              </p>

              <div className="flex flex-wrap gap-1.5">
                {safeWords.map((word) => (
                  <span key={word} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/60">
                    &quot;{word}&quot;
                  </span>
                ))}
              </div>

              {/* Simulated chat preview */}
              <div className="border border-white/5 rounded-xl bg-black/40 overflow-hidden">
                <div className="bg-white/[0.02] border-b border-white/5 px-2 py-1.5 flex items-center justify-between text-[8px] text-white/30 font-mono">
                  <span>SIMULATED CHAT INTERFACE</span>
                  <span className="text-emerald-400">● SECURE</span>
                </div>
                
                <div className="p-2 space-y-1.5 max-h-24 overflow-y-auto">
                  {chatLog.map((log, i) => (
                    <div key={i} className={`flex ${log.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`px-2 py-1 rounded-lg text-[9px] max-w-[80%] ${
                        log.sender === "user" ? "bg-cyan-500/20 text-cyan-200" : "bg-white/5 text-white/60"
                      }`}>
                        {log.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5 p-1 flex gap-1 bg-black/20">
                  <input
                    type="text"
                    placeholder="Type 'Aunt Mary called.' to test..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-transparent text-[9px] text-white outline-none w-full px-1.5"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-cyan-500/20 border border-cyan-400/20 text-cyan-400 text-[8px] px-2 py-0.5 rounded font-semibold"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Complete Trip Trigger Button */}
          <button
            onClick={endTrip}
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-white"
          >
            Complete Journey
          </button>
        </div>
      )}
    </div>
  );
}
