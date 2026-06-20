"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, Landmark, Monitor, UserCheck, Smartphone, Sparkles, CheckCircle2, ChevronRight, Lock, Flame } from "lucide-react";
import { useTravelSafeStore, UserPersona } from "@/store/useTravelSafeStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zustand state
  const setAuthStatus = useTravelSafeStore((s) => s.setAuthStatus);
  const setUserPersona = useTravelSafeStore((s) => s.setUserPersona);
  const setAadhaarDetails = useTravelSafeStore((s) => s.setAadhaarDetails);
  const systemMode = useTravelSafeStore((s) => s.systemMode);
  const storeUserName = useTravelSafeStore((s) => s.userName);
  const isEmergency = systemMode !== "SAFE";

  // Auth flow local state
  const [selectedRole, setSelectedRole] = useState<UserPersona | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authStep, setAuthStep] = useState<"INPUT" | "OTP" | "FACE" | "SUCCESS" | "BIOMETRIC">("INPUT");
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [faceMeshPoints, setFaceMeshPoints] = useState<number>(0);

  const roles = [
    {
      id: "CIVILIAN" as UserPersona,
      title: "Civilian Portal",
      desc: "Personal safety companion, kinematic AI snatch-detection, stealth SOS safe-words, and secure evidence vaults.",
      icon: <Users className="text-emerald-400 group-hover:text-emerald-300 transition-colors" size={28} />,
      count: "12,847 Active",
      color: "border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-950/5 hover:bg-emerald-950/15",
    },
    {
      id: "GUARDIAN" as UserPersona,
      title: "Guardian Network",
      desc: "Aadhaar-verified emergency responders. Accept nearby alert notifications within 5KM and coordinate shields.",
      icon: <UserCheck className="text-cyan-400 group-hover:text-cyan-300 transition-colors" size={28} />,
      count: "847 Active",
      color: "border-cyan-500/20 hover:border-cyan-500/50 bg-cyan-950/5 hover:bg-cyan-950/15",
    },
    {
      id: "POLICE" as UserPersona,
      title: "Police Command",
      desc: "Military-grade dashboard for law enforcement. Auto-FIR generators, Merkle evidence review, and vehicle dispatch.",
      icon: <Landmark className="text-purple-400 group-hover:text-purple-300 transition-colors" size={28} />,
      count: "24 Active Hubs",
      color: "border-purple-500/20 hover:border-purple-500/50 bg-purple-950/5 hover:bg-purple-950/15",
    },
    {
      id: "ADMIN" as UserPersona,
      title: "Super Admin Control",
      desc: "NASA-style oversight tower. National safety twins maps, smart city CCTV streams, and Aadhaar approvals.",
      icon: <Monitor className="text-orange-400 group-hover:text-orange-300 transition-colors" size={28} />,
      count: "Control Tower",
      color: "border-orange-500/20 hover:border-orange-500/50 bg-orange-950/5 hover:bg-orange-950/15",
    },
  ];

  // Draw 3D-style Holographic India map with pulsing network nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Node locations (scaled to canvas size)
    const nodes = [
      { name: "Delhi", x: 0.45, y: 0.28, pulseSpeed: 0.05, size: 6, state: isEmergency ? "ALERT" : "SAFE" },
      { name: "Mumbai", x: 0.38, y: 0.58, pulseSpeed: 0.03, size: 5, state: "SAFE" },
      { name: "Bangalore", x: 0.46, y: 0.76, pulseSpeed: 0.04, size: 5, state: "SAFE" },
      { name: "Kolkata", x: 0.72, y: 0.42, pulseSpeed: 0.03, size: 5, state: "SAFE" },
      { name: "Hyderabad", x: 0.48, y: 0.61, pulseSpeed: 0.035, size: 4, state: "SAFE" },
      { name: "Chennai", x: 0.51, y: 0.79, pulseSpeed: 0.045, size: 4, state: "SAFE" },
    ];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.02;

      const w = canvas.width;
      const h = canvas.height;

      // Draw cyber matrix grid
      ctx.strokeStyle = isEmergency ? "rgba(239, 68, 68, 0.04)" : "rgba(16, 185, 129, 0.02)";
      ctx.lineWidth = 0.5;
      const spacing = 40;
      for (let x = 0; x < w; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Draw holographic connection links
      ctx.strokeStyle = isEmergency ? "rgba(239, 68, 68, 0.15)" : "rgba(6, 182, 212, 0.1)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          ctx.moveTo(nodes[i].x * w, nodes[i].y * h);
          ctx.lineTo(nodes[j].x * w, nodes[j].y * h);
        }
      }
      ctx.stroke();

      // Draw pulsing nodes
      nodes.forEach((n) => {
        const nx = n.x * w;
        const ny = n.y * h;
        const pulse = Math.sin(time * 3 + n.x * 100) * 8 + 10;

        const isNodeEmergency = isEmergency && n.name === "Delhi";

        // Ambient node glow
        ctx.fillStyle = isNodeEmergency ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.07)";
        ctx.beginPath();
        ctx.arc(nx, ny, n.size + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Node center
        ctx.fillStyle = isNodeEmergency ? "#ef4444" : "#10b981";
        ctx.beginPath();
        ctx.arc(nx, ny, n.size, 0, Math.PI * 2);
        ctx.fill();

        // Text tag
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.font = "8px monospace";
        ctx.fillText(n.name, nx - 15, ny - 10);
      });

      // Data packets stream animation
      ctx.fillStyle = isEmergency ? "#ef4444" : "#06b6d4";
      for (let i = 0; i < 3; i++) {
        const t = (time * 0.1 + i * 0.33) % 1;
        // From Delhi to Bangalore
        const p1 = nodes[0];
        const p2 = nodes[2];
        const px = p1.x * w + (p2.x * w - p1.x * w) * t;
        const py = p1.y * h + (p2.y * h - p1.y * h) * t;
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [isEmergency]);

  // Auth flow triggers
  const handleRoleSelect = (role: UserPersona) => {
    setSelectedRole(role);
    setIsVerifying(true);
    
    // Check if store already has verified credentials for this role
    const store = useTravelSafeStore.getState();
    if (store.isAuthenticated && store.userPersona === role) {
      setAuthStep("BIOMETRIC");
    } else {
      setAuthStep("INPUT");
    }
  };

  const triggerBiometricVerify = (method: string) => {
    setAuthStep("FACE");
    setFaceMeshPoints(0);
    let count = 0;
    const interval = setInterval(() => {
      count += 20;
      setFaceMeshPoints(count);
      if (count >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setAuthStep("SUCCESS");
          setAuthStatus(true);
          setUserPersona(selectedRole);
        }, 500);
      }
    }, 150);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarInput.length === 12 && mobileInput.length === 10) {
      setAuthStep("OTP");
    } else {
      alert("Aadhaar must be 12 digits, Mobile must be 10 digits.");
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === "123456" || otpInput.length === 6) {
      setAuthStep("FACE");
      // Simulate face scan incremental dots
      let count = 0;
      const interval = setInterval(() => {
        count += 12;
        setFaceMeshPoints(count);
        if (count >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setAuthStep("SUCCESS");
            setAuthStatus(true);
            setUserPersona(selectedRole);
            setAadhaarDetails(aadhaarInput, mobileInput, selectedRole === "CIVILIAN" ? "Priya Sharma" : selectedRole === "GUARDIAN" ? "Rahul Singh" : selectedRole === "POLICE" ? "Inspector Sharma" : "Super Admin");
          }, 800);
        }
      }, 300);
    } else {
      alert("Verification Code incorrect. Enter any 6 digits (e.g. 123456).");
    }
  };

  const handleFinalRedirect = () => {
    setIsVerifying(false);
    if (selectedRole === "CIVILIAN") router.push("/civilian");
    if (selectedRole === "GUARDIAN") router.push("/guardian");
    if (selectedRole === "POLICE") router.push("/police");
    if (selectedRole === "ADMIN") router.push("/admin");
  };

  return (
    <main className="min-h-screen relative bg-[#040407] text-white flex flex-col justify-between overflow-hidden">
      {/* India Map Holographic Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top HUD */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5 backdrop-blur-md bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
            <Shield className={isEmergency ? "text-red-400 text-glow-crimson" : "text-emerald-400 text-glow-emerald"} size={20} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider font-[family-name:var(--font-display)]">
              TRAVELSAFE <span className={isEmergency ? "text-red-400" : "text-emerald-400"}>X</span>
            </h1>
            <p className="text-[9px] text-white/30 uppercase tracking-widest leading-none mt-0.5">Predictive Security Infrastructure</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-white/40 tracking-wider">
            STATUS: {isEmergency ? "ALERT IN DELHI NCR" : "SYSTEM STABLE"}
          </span>
          <span className={`w-2.5 h-2.5 rounded-full ${isEmergency ? "bg-red-500 status-blink" : "bg-emerald-400"}`} />
        </div>
      </header>

      {/* Main Title Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-4">
            <Sparkles size={12} className="text-cyan-400" /> Ministry of Home Affairs Sandbox
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-6xl font-extrabold font-[family-name:var(--font-display)] tracking-tight leading-[0.95] mb-4"
        >
          Predict. Protect. <span className={isEmergency ? "text-red-400 text-glow-crimson" : "text-emerald-400 text-glow-emerald"}>Respond.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xs md:text-sm text-white/40 max-w-xl mx-auto leading-relaxed"
        >
          Select your operational role below to enter the secure environment. Live safety metrics and biometric verification sync across portals instantly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-6"
        >
          <Link
            href="/xyroshield"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600/30 to-amber-600/30 border border-red-500/40 text-red-200 text-xs font-bold uppercase tracking-wider hover:from-red-600/40 hover:to-amber-600/40 hover:glow-crimson transition-all"
          >
            <Flame size={14} className="text-amber-400 animate-pulse" />
            Launch XyroShield™ Simulator Demo
          </Link>
        </motion.div>
      </div>

      {/* Role Cards Grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {roles.map((role, idx) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 * idx }}
            whileHover={{ y: -6, scale: 1.02 }}
            onClick={() => handleRoleSelect(role.id)}
            className={`group rounded-2xl border p-5 flex flex-col justify-between h-64 backdrop-blur-xl cursor-pointer transition-all ${role.color}`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                {role.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white/90 font-[family-name:var(--font-display)] flex items-center gap-1.5">
                  {role.title} <ChevronRight size={14} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">{role.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4 text-[9px] font-mono text-white/30">
              <span>SECURITY LEVEL: 4A</span>
              <span className="text-emerald-400">{role.count}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Aadhaar Verification Modal Overlay */}
      <AnimatePresence>
        {isVerifying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0c12] p-6 shadow-2xl space-y-6 relative overflow-hidden"
            >
              {/* Scanlines in Modal */}
              <div className="absolute inset-0 scanlines pointer-events-none opacity-20" />

              {/* Close Button */}
              <button
                onClick={() => setIsVerifying(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10"
              >
                <X size={14} />
              </button>

              {/* Header Title */}
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                  <Lock className="text-cyan-400 animate-pulse" size={18} />
                </div>
                <h3 className="text-base font-bold font-[family-name:var(--font-display)] text-white/95">
                  Aadhaar Verification System
                </h3>
                <p className="text-[10px] text-white/40 mt-0.5">Government-grade identity sync</p>
              </div>

              {/* Steps Render */}
              {authStep === "BIOMETRIC" && (
                <div className="space-y-6 text-center py-2 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
                      Welcome Back
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {storeUserName || (selectedRole === "CIVILIAN"
                        ? "Priya Sharma"
                        : selectedRole === "GUARDIAN"
                        ? "Rahul Singh"
                        : selectedRole === "POLICE"
                        ? "Inspector Sharma"
                        : "Super Admin")}
                    </h3>
                    <p className="text-[9px] text-white/40 font-mono">Verified ID: e-KYC Active</p>
                  </div>
                  
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <label className="text-[9px] uppercase tracking-widest text-white/35 font-mono font-bold block mb-2">
                      Secure One-Tap Login
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => triggerBiometricVerify("Face ID")}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-white/60 hover:text-white"
                      >
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                          <Users size={16} />
                        </div>
                        <span className="text-[8px] font-bold">Face ID</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerBiometricVerify("Fingerprint")}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-white/60 hover:text-white"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <Smartphone size={16} />
                        </div>
                        <span className="text-[8px] font-bold">Fingerprint</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerBiometricVerify("Device PIN")}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-white/60 hover:text-white"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                          <Lock size={16} />
                        </div>
                        <span className="text-[8px] font-bold">Device PIN</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerBiometricVerify("One Tap")}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-xs font-bold uppercase tracking-wider hover:from-emerald-500 hover:to-cyan-500 transition-all mt-4 text-white"
                  >
                    Instant Biometric Bypass
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthStep("INPUT")}
                    className="text-[8px] uppercase tracking-wider text-white/30 hover:text-white block mx-auto underline mt-2"
                  >
                    Reset & Sign in with Aadhaar
                  </button>
                </div>
              )}

              {authStep === "INPUT" && (
                <form onSubmit={handleInputSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono font-bold block">
                      Enter 12-Digit Aadhaar Card Number
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/40 border border-white/5">
                      <Lock size={14} className="text-white/20" />
                      <input
                        type="text"
                        maxLength={12}
                        pattern="\d{12}"
                        placeholder="1234 5678 9012"
                        value={aadhaarInput}
                        onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, ""))}
                        required
                        className="bg-transparent text-xs text-white/90 outline-none w-full font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono font-bold block">
                      Registered Mobile Number
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/40 border border-white/5">
                      <Smartphone size={14} className="text-white/20" />
                      <input
                        type="text"
                        maxLength={10}
                        pattern="\d{10}"
                        placeholder="9876543210"
                        value={mobileInput}
                        onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, ""))}
                        required
                        className="bg-transparent text-xs text-white/90 outline-none w-full font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-xs font-bold uppercase tracking-wider hover:from-cyan-500 hover:to-cyan-600 transition-all mt-4"
                  >
                    Request OTP
                  </button>
                </form>
              )}

              {authStep === "OTP" && (
                <form onSubmit={handleOtpSubmit} className="space-y-4 text-center">
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Enter the 6-digit verification code sent to <span className="font-mono text-cyan-400">{mobileInput}</span>.
                  </p>
                  
                  <div className="flex items-center justify-center gap-2 py-2 bg-black/40 border border-white/5 rounded-xl max-w-[200px] mx-auto">
                    <input
                      type="text"
                      maxLength={6}
                      pattern="\d{6}"
                      placeholder="123456"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                      required
                      className="bg-transparent text-sm font-bold tracking-widest text-center text-white outline-none w-full font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-xs font-bold uppercase tracking-wider hover:from-cyan-500 hover:to-cyan-600 transition-all mt-4"
                  >
                    Verify Code
                  </button>
                </form>
              )}

              {authStep === "FACE" && (
                <div className="flex flex-col items-center justify-center space-y-4 py-3">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* Face circle mesh */}
                    <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/35 animate-spin" style={{ animationDuration: "10s" }} />
                    <motion.div
                      className="absolute inset-2 rounded-full border border-cyan-400"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.7, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <div className="w-20 h-20 rounded-full bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center text-[10px] font-mono text-cyan-400/80">
                      SCANNING
                    </div>
                  </div>
                  
                  <div className="w-full space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-white/40 uppercase">
                      <span>Face Mesh Mapping</span>
                      <span>{faceMeshPoints}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${faceMeshPoints}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {authStep === "SUCCESS" && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Verification Complete</h4>
                    <p className="text-[10px] text-white/40 mt-1 font-mono">
                      Trust Score synchronized: 98% (High)
                    </p>
                  </div>
                  <button
                    onClick={handleFinalRedirect}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-xs font-bold uppercase tracking-wider hover:from-emerald-500 hover:to-emerald-600 transition-all"
                  >
                    Enter operational space
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-4 px-8 backdrop-blur-md bg-black/10 text-center flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] text-white/20 select-none">
        <span>TRAVELSAFE X © 2026 — SECURED BY MERKLE PROOF LEDGER & AADHAAR ID</span>
        <span>NATIONAL INFRASTRUCTURE DEMO PLATFORM</span>
      </footer>
    </main>
  );
}

// Simple inline X icon helper since lucide-react name is X
function X({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
