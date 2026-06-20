"use client";

import { motion } from "framer-motion";
import { Shield, MapPin, Eye, Users, AlertTriangle, HelpCircle } from "lucide-react";
import { useTravelSafeStore } from "@/store/useTravelSafeStore";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

export function HomeTab() {
  const systemMode = useTravelSafeStore((s) => s.systemMode);
  const metrics = useTravelSafeStore((s) => s.metrics);
  const userName = useTravelSafeStore((s) => s.userName) || "Priya Sharma";
  const isEmergency = systemMode !== "SAFE";

  const getStatusText = () => {
    switch (systemMode) {
      case "SAFE":
        return { text: "Safe", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dotClass: "bg-emerald-400" };
      case "ALERT":
      case "ESCALATION":
        return { text: "Caution", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", dotClass: "bg-orange-400" };
      case "SOS":
      case "RESPONSE":
        return { text: "High Risk", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", dotClass: "bg-red-400" };
      default:
        return { text: "Safe", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dotClass: "bg-emerald-400" };
    }
  };

  const status = getStatusText();

  // Score factors
  const factors = [
    { label: "Lighting Quality", value: isEmergency ? 28 : 88, color: "text-cyan-400", icon: <Eye size={12} /> },
    { label: "Crowd Density", value: isEmergency ? 12 : 72, color: "text-purple-400", icon: <Users size={12} /> },
    { label: "Incident Prob.", value: isEmergency ? 82 : 8, color: "text-orange-400", icon: <AlertTriangle size={12} /> },
    { label: "Community Guard", value: isEmergency ? 98 : 92, color: "text-emerald-400", icon: <Shield size={12} /> },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Top Header Card */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white/90">Good Evening, {userName.split(" ")[0]} 👋</h2>
          <p className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
            <MapPin size={10} className="text-emerald-400" /> Delhi, Connaught Place
          </p>
        </div>
        
        {/* Animated Avatar Ring */}
        <div className="relative">
          <motion.div
            className={`absolute -inset-1 rounded-full border border-dashed ${isEmergency ? "border-red-500" : "border-emerald-500"}`}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          />
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
            {userName.split(" ").map(n => n[0]).join("").toUpperCase()}
          </div>
        </div>
      </div>

      {/* Safety Status card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-4 border ${status.bg} backdrop-blur-md`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-widest">Safety Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full status-blink ${status.dotClass}`} />
              <h3 className={`text-xl font-extrabold tracking-wide ${status.color}`}>
                {status.text}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-white/30 block">Last Check-in</span>
            <span className="text-xs font-semibold text-white/70 font-mono">04:38 AM</span>
          </div>
        </div>
      </motion.div>

      {/* Central Progress Score Ring */}
      <div className="flex flex-col items-center justify-center py-4 bg-white/[0.01] border border-white/5 rounded-3xl p-4">
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* SVG Progress Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="6"
            />
            {/* Animated progress ring */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={isEmergency ? "#dc2626" : "#10b981"}
              strokeWidth="6"
              strokeDasharray="251.2"
              initial={{ strokeDashoffset: 251.2 }}
              animate={{ strokeDashoffset: 251.2 - (251.2 * metrics.luminaScore) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>

          {/* Text labels inside ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <AnimatedCounter
              value={metrics.luminaScore}
              className={`text-5xl font-extrabold font-[family-name:var(--font-display)] ${
                isEmergency ? "text-red-400 text-glow-crimson" : "text-emerald-400 text-glow-emerald"
              }`}
            />
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mt-0.5">
              Lumina Score
            </span>
          </div>
        </div>

        {/* Score factors grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
          {factors.map((factor) => (
            <div key={factor.label} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-1 text-[9px] text-white/40 mb-1">
                {factor.icon}
                <span>{factor.label}</span>
              </div>
              <p className={`text-xs font-bold font-mono ${factor.color}`}>{factor.value}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="rounded-xl p-3 bg-[#12121a]/60 border border-white/5 flex items-start gap-3">
        <HelpCircle size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[11px] font-semibold text-white/80">Safety tip for Delhi NCR</h4>
          <p className="text-[9px] text-white/40 leading-relaxed mt-0.5">
            Routes passing metro zones are highly lit. Avoid Sector 7-G due to reported public construction blockage.
          </p>
        </div>
      </div>
    </div>
  );
}
