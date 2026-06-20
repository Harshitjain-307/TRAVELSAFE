"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, Eye, PhoneCall, FileText, Share2 } from "lucide-react";
import { useTravelSafeStore } from "@/store/useTravelSafeStore";
import { ResponderStatusPanel } from "@/components/tracking/ResponderStatusPanel";
import { isTrackingActive } from "@/lib/tracking";

export function SOSSimulation() {
  const systemMode = useTravelSafeStore((s) => s.systemMode);
  const sosCounter = useTravelSafeStore((s) => s.sosCounter);
  const firGenerated = useTravelSafeStore((s) => s.firGenerated);
  const emergencyPackets = useTravelSafeStore((s) => s.emergencyPackets);
  const trackingSnapshot = useTravelSafeStore((s) => s.trackingSnapshot);
  const stopThreatSimulation = useTravelSafeStore((s) => s.stopThreatSimulation);

  const isEmergency = systemMode !== "SAFE";
  const trackingActive = isTrackingActive(trackingSnapshot);

  if (!isEmergency) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-red-950/90 z-50 flex flex-col justify-between p-6 overflow-hidden"
      >
        {/* Red Flashing Screen overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              "radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 80%)",
              "radial-gradient(circle, rgba(220,38,38,0.4) 0%, transparent 80%)",
              "radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 80%)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />

        {/* Scanlines */}
        <div className="absolute inset-0 scanlines pointer-events-none" />

        {/* Header Alert Status */}
        <div className="relative z-10 flex items-center justify-between border-b border-red-500/20 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-400 animate-pulse" size={20} />
            <div>
              <h3 className="text-sm font-extrabold tracking-wider text-red-400 font-[family-name:var(--font-display)]">
                EMERGENCY SOS ACTIVE
              </h3>
              <p className="text-[8px] text-red-500/60 uppercase tracking-widest font-mono">
                System Mode: {systemMode}
              </p>
            </div>
          </div>
          
          <button
            onClick={stopThreatSimulation}
            className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/20"
          >
            <X size={14} />
          </button>
        </div>

        {/* Central SOS Ring Counter */}
        <div className="relative z-10 flex flex-col items-center justify-center py-6 text-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Outer Pulsing SOS Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border border-red-500/40"
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border border-red-500/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            />
            
            <div className="w-28 h-28 rounded-full bg-red-600 border border-red-500 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              <span className="text-[9px] uppercase tracking-widest text-red-200/60 font-semibold font-mono">Timer</span>
              <span className="text-3xl font-extrabold text-white font-mono">
                {String(Math.floor(sosCounter / 60)).padStart(2, "0")}:{String(sosCounter % 60).padStart(2, "0")}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-red-200/80 font-medium max-w-[200px] mt-4 leading-normal">
            Delhi Police dispatch, 847 Community Guardians, and emergency contacts are synced with your live data.
          </p>
        </div>

        {/* Live Broadcast Metrics Ticker */}
        <div className="relative z-10 space-y-3 flex-1 overflow-y-auto max-h-[180px] pr-1 scrollbar-none my-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded bg-red-950/40 border border-red-500/10 text-center">
              <Share2 size={12} className="mx-auto text-red-400 mb-1" />
              <span className="text-[8px] text-red-200/50 block font-mono">Location</span>
              <span className="text-[9px] font-bold text-red-400 block font-mono">SHARING</span>
            </div>
            <div className="p-2 rounded bg-red-950/40 border border-red-500/10 text-center">
              <Eye size={12} className="mx-auto text-red-400 mb-1" />
              <span className="text-[8px] text-red-200/50 block font-mono">Evidence</span>
              <span className="text-[9px] font-bold text-red-400 block font-mono">RECORDING</span>
            </div>
            <div className="p-2 rounded bg-red-950/40 border border-red-500/10 text-center">
              <PhoneCall size={12} className="mx-auto text-red-400 mb-1" />
              <span className="text-[8px] text-red-200/50 block font-mono">Guardians</span>
              <span className="text-[9px] font-bold text-red-400 block font-mono">T-0 ROUTED</span>
            </div>
          </div>

          {/* Live Responder Tracking during SOS */}
          {trackingActive && (
            <div className="rounded-lg bg-black/40 border border-red-500/10 p-2">
              <ResponderStatusPanel snapshot={trackingSnapshot} variant="civilian" compact />
            </div>
          )}

          {/* Emergency Logs Stream */}
          <div className="rounded-lg bg-black/40 border border-red-500/10 p-2 text-[9px] font-mono text-red-400/80 space-y-1">
            {emergencyPackets.slice(0, 4).map((packet) => (
              <div key={packet.id} className="flex gap-1.5 leading-normal">
                <span className="text-red-600">{packet.timestamp}</span>
                <span>{packet.message}</span>
              </div>
            ))}
            {emergencyPackets.length === 0 && (
              <p className="text-[8px] text-white/20 italic text-center py-2">Establishing secure pipeline...</p>
            )}
          </div>

          {/* FIR Ticker Info */}
          {firGenerated && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-center space-y-1"
            >
              <p className="text-[10px] font-bold text-red-400 flex items-center justify-center gap-1">
                <FileText size={10} /> Auto-FIR Dispatch Verified
              </p>
              <p className="text-[8px] text-red-200/50 font-mono">
                Forwarded to Delhi Police Control Room #2
              </p>
            </motion.div>
          )}
        </div>

        {/* Bottom De-Escalate Cancel Trigger */}
        <div className="relative z-10">
          <button
            onClick={stopThreatSimulation}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs tracking-wider uppercase backdrop-blur-md transition-all"
          >
            Cancel / End Simulation
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
