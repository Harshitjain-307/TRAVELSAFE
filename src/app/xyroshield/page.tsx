"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Shield,
  ArrowLeft,
  Brain,
  Zap,
  Wifi,
  Landmark,
  UserCheck,
  RotateCcw,
  Volume2,
  Play,
  FileText,
  AlertTriangle,
  Heart,
  Mic,
  ShieldAlert
} from "lucide-react";
import { useTravelSafeStore } from "@/store/useTravelSafeStore";

const InteractiveMap = dynamic(() => import("@/components/ui/InteractiveMap"), {
  ssr: false,
});

interface SimStep {
  title: string;
  desc: string;
  duration: number;
}

// 12-Step Critical Event Flow for the combined escalation engine
const DUAL_SIMULATION_STEPS: SimStep[] = [
  { title: "Continuous Monitoring", desc: "AI monitoring: Grip kinematics stable (99%), Voice tone nominal (🟢 NORMAL).", duration: 3000 },
  { title: "Suspicious Behavior Detected", desc: "Minor gait fluctuations. High-pitch ambient conversation detected (🟡 SUSPICIOUS).", duration: 2500 },
  { title: "Phone Snatch + Scream Event", desc: "Kinematic spike + distress scream ('HELP!'). Threat Confidence: 99% (🔴 CRITICAL).", duration: 2500 },
  { title: "Instant Emergency Page", desc: "Device switches automatically to Red Alarm dashboard. Voice & front/rear camera recordings start.", duration: 3000 },
  { title: "WatchSync™ Separation Backup", desc: "Smartwatch vibrates aggressively. Bluetooth separation matched. Heart rate spikes to 142 BPM.", duration: 2500 },
  { title: "Live Audio Evidence Lock", desc: "Live ambient audio stream cryptographically signed and locked to the blockchain Witness ledger.", duration: 2500 },
  { title: "Stealth Protection Engaged", desc: "Fake 'Powering Off...' screen. Phone goes black to mislead attacker, but tracking/recording continue.", duration: 3000 },
  { title: "Guardian Critical Broadcast", desc: "SOS packet propagated to 847 nearby guardians. Alert receiver displays Priya's details.", duration: 2500 },
  { title: "Guardian accepts Rescue", desc: "Volunteer Rahul Singh accepts rescue mission. ETA 4m. Aadhaar Verified (Trust Score: 98).", duration: 2500 },
  { title: "Civilian Reassurance Sync", desc: "Secret reassurance HUD overlay fades in on victim's screen: 'HELP IS ON THE WAY' with ETAs.", duration: 2500 },
  { title: "Multi-Guardian Convergence", desc: "Two additional nearby guardians join the coordinates, visualizing route paths on map grid.", duration: 2500 },
  { title: "Police Auto-FIR & Interception", desc: "Auto-FIR summary generated. Merkle proofs verified. PCR units intercept and recover device.", duration: 0 },
];

export default function XyroShieldPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCanvasRef = useRef<HTMLCanvasElement>(null);

  // Zustand Store
  const addNotification = useTravelSafeStore((s) => s.addNotification);

  // Simulation Selector States
  const [isPlaying, setIsPlaying] = useState(false);
  const [simMode, setSimMode] = useState<"DUAL" | "SNATCH_ONLY" | "SCREAM_ONLY">("DUAL");
  const [currentStep, setCurrentStep] = useState(0);

  // Map Geolocation States
  const [mapCenter, setMapCenter] = useState({ lat: 28.6273, lng: 77.3725 });
  const [mapMarkers, setMapMarkers] = useState<{ id: string; lat: number; lng: number; label: string; type: "victim" | "guardian" | "police" | "safezone" }[]>([]);
  const [mapRoute, setMapRoute] = useState<[number, number][]>([]);
  const [deviceTrail, setDeviceTrail] = useState<[number, number][]>([]);

  // Core Visualizer metrics
  const [gripConfidence, setGripConfidence] = useState(99);
  const [voiceConfidence, setVoiceConfidence] = useState(2);
  const [detectedKeyword, setDetectedKeyword] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<"NORMAL" | "SUSPICIOUS" | "EMERGENCY">("NORMAL");
  const [xyroStatus, setXyroStatus] = useState<"SECURE" | "SUSPICIOUS" | "GRAB_DETECTED" | "SHUTDOWN" | "TRACKING">("SECURE");
  
  // Device & Responders status
  const [watchHeartRate, setWatchHeartRate] = useState(72);
  const [watchSeparated, setWatchSeparated] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [selectedGuardianOption, setSelectedGuardianOption] = useState<string | null>(null);
  const [policePriority, setPolicePriority] = useState<"NORMAL" | "HIGH" | "CRITICAL">("NORMAL");
  const [evidenceUploaded, setEvidenceUploaded] = useState(false);
  const [timelineLogs, setTimelineLogs] = useState<string[]>(["[05:15:00] TravelSafe X: Combined Escalation Engine online & monitoring."]);

  const isEmergency = xyroStatus !== "SECURE" || voiceState === "EMERGENCY";

  const addLog = useCallback((text: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setTimelineLogs((prev) => [`[${timeStr}] ${text}`, ...prev].slice(0, 30));
  }, []);

  // Multi-trigger simulation runner
  useEffect(() => {
    if (!isPlaying) return;

    let timer: NodeJS.Timeout;

    const runDualSimulation = () => {
      const step = DUAL_SIMULATION_STEPS[currentStep];

      switch (currentStep) {
        case 0:
          setXyroStatus("SECURE");
          setVoiceState("NORMAL");
          setGripConfidence(99);
          setVoiceConfidence(2);
          setDetectedKeyword(null);
          setWatchHeartRate(72);
          setWatchSeparated(false);
          setCountdown(10);
          setPolicePriority("NORMAL");
          setSelectedGuardianOption(null);
          setEvidenceUploaded(false);
          setMapCenter({ lat: 28.6273, lng: 77.3725 });
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "Priya Sharma (Secure)", type: "victim" }]);
          setMapRoute([]);
          setDeviceTrail([[28.6273, 77.3725]]);
          addLog("Dual System Calibration: Kinematics 99%, Acoustic baseline stable.");
          break;
        case 1:
          setXyroStatus("SUSPICIOUS");
          setVoiceState("SUSPICIOUS");
          setGripConfidence(45);
          setVoiceConfidence(42);
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "Priya S. (Stress Tone Detected)", type: "victim" }]);
          addLog("Suspicious Event: Kinematic gait drop + high-pitch conversation.");
          addNotification("VoiceShield: Elevated sound stress levels recorded.");
          break;
        case 2:
          setXyroStatus("GRAB_DETECTED");
          setVoiceState("EMERGENCY");
          setGripConfidence(6);
          setVoiceConfidence(99);
          setDetectedKeyword("HELP!");
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "CRITICAL: SOS Triggered", type: "victim" }]);
          addLog("CRITICAL: Combined Trigger. Snatch motion + 'HELP!' vocal scream matching.");
          addNotification("🚨 Threat Matrix: Dual trigger active! Severity: CRITICAL.");
          break;
        case 3:
          setCountdown(10);
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "Verification countdown active", type: "victim" }]);
          addLog("Emergency Dashboard: Instant redirection active. Camera recordings started.");
          break;
        case 4:
          setWatchSeparated(true);
          setWatchHeartRate(142);
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "Phone separated from smartwatch", type: "victim" }]);
          addLog("WatchSync: Smartwatch separation trigger. Haptic pulses dispatched.");
          break;
        case 5:
          setCountdown(0);
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "Audit hash locked to Merkle tree", type: "victim" }]);
          addLog("Live Evidence: Ambient audio commit locked onto Witness Blockchain.");
          break;
        case 6:
          setXyroStatus("SHUTDOWN");
          setMapCenter({ lat: 28.6285, lng: 77.3745 });
          setMapMarkers([{ id: "v", lat: 28.6285, lng: 77.3745, label: "Dummy powered off (Secret GPS active)", type: "victim" }]);
          setDeviceTrail(prev => [...prev, [28.6285, 77.3745]]);
          addLog("Stealth Mode: Dummy powering off visible on civilian app.");
          break;
        case 7:
          setXyroStatus("TRACKING");
          setMapCenter({ lat: 28.6295, lng: 77.3765 });
          setMapMarkers([{ id: "v", lat: 28.6295, lng: 77.3765, label: "Theft target: 48 km/h heading N-NE", type: "victim" }]);
          setDeviceTrail(prev => [...prev, [28.6295, 77.3765]]);
          addLog("GPS Tracking: Beacon active. Communcating live vectors to Police Command.");
          addNotification("System Control: GPS beacon tracking activated.");
          break;
        case 8:
          setMapMarkers([
            { id: "v", lat: 28.6295, lng: 77.3765, label: "SOS broadcast active", type: "victim" },
            { id: "sz1", lat: 28.6240, lng: 77.3700, label: "Noida Sector 62 PS", type: "safezone" }
          ]);
          addLog("Guardian Alerts: Transmitting emergency packet with live tracking link.");
          break;
        case 9:
          setSelectedGuardianOption("YES");
          setMapMarkers([
            { id: "v", lat: 28.6295, lng: 77.3765, label: "Theft target moving", type: "victim" },
            { id: "sz1", lat: 28.6240, lng: 77.3700, label: "Noida Sector 62 PS", type: "safezone" },
            { id: "g1", lat: 28.6225, lng: 77.3660, label: "Guardian Rahul (ETA 4m)", type: "guardian" }
          ]);
          setMapRoute([[28.6225, 77.3660], [28.6295, 77.3765]]);
          addLog("Guardian Accepted: Volunteer Rahul Singh heading to नोएडा Sec-62 (ETA 4m).");
          addNotification("Rescue: Aadhaar-verified responder on route.");
          break;
        case 10:
          addLog("Civilian Reassurance: Reassurance screen synchronized.");
          break;
        case 11:
          setMapCenter({ lat: 28.6310, lng: 77.3780 });
          setMapMarkers([
            { id: "v", lat: 28.6310, lng: 77.3780, label: "Theft target tracking", type: "victim" },
            { id: "g1", lat: 28.6255, lng: 77.3710, label: "Guardian Rahul (ETA 2m)", type: "guardian" },
            { id: "g2", lat: 28.6335, lng: 77.3840, label: "Guardian Sneha (ETA 3m)", type: "guardian" }
          ]);
          setMapRoute([[28.6255, 77.3710], [28.6310, 77.3780], [28.6335, 77.3840]]);
          setDeviceTrail(prev => [...prev, [28.6310, 77.3780]]);
          addLog("Multi-Guardian: Responders Sneha G. (ETA 3m) & Amit T. (ETA 5m) converged.");
          break;
        case 12:
          setPolicePriority("CRITICAL");
          setEvidenceUploaded(true);
          setMapCenter({ lat: 28.6310, lng: 77.3780 });
          setMapMarkers([
            { id: "v", lat: 28.6310, lng: 77.3780, label: "Theft target secured", type: "victim" },
            { id: "g1", lat: 28.6310, lng: 77.3780, label: "Guardian Rahul (Arrived)", type: "guardian" },
            { id: "p1", lat: 28.6310, lng: 77.3780, label: "PCR CP-4 (Arrived)", type: "police" }
          ]);
          setMapRoute([]);
          addLog("SUCCESS: PCR interception complete. Device recovered. Threat neutralized.");
          addNotification("TravelSafe: Incident resolved successfully.");
          setIsPlaying(false);
          break;
      }

      if (currentStep < DUAL_SIMULATION_STEPS.length - 1) {
        timer = setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
        }, step.duration);
      } else {
        setIsPlaying(false);
      }
    };

    const runSnatchOnly = () => {
      // Snatch Only workflow
      switch (currentStep) {
        case 0:
          setXyroStatus("SECURE");
          setGripConfidence(99);
          setCountdown(10);
          setMapCenter({ lat: 28.6273, lng: 77.3725 });
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "Priya S. (Monitoring)", type: "victim" }]);
          setMapRoute([]);
          addLog("XyroShield: Calibration nominal. Monitoring grip pressure.");
          break;
        case 1:
          setXyroStatus("SUSPICIOUS");
          setGripConfidence(42);
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "XyroShield: Anomaly", type: "victim" }]);
          addLog("XyroShield: Suspect gait profile detected.");
          break;
        case 2:
          setXyroStatus("GRAB_DETECTED");
          setGripConfidence(8);
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "XyroShield: Grab Detected", type: "victim" }]);
          addLog("XyroShield Alert: Sudden snatch velocity spike. Countdown started.");
          break;
        case 3:
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "Override countdown active", type: "victim" }]);
          addLog("Verification: System waiting for safe-key cancellation.");
          break;
        case 4:
          setCountdown(0);
          setXyroStatus("SHUTDOWN");
          setMapCenter({ lat: 28.6285, lng: 77.3745 });
          setMapMarkers([{ id: "v", lat: 28.6285, lng: 77.3745, label: "Dummy poweroff active", type: "victim" }]);
          addLog("Stealth Mode: Timeout expired. Device powered off.");
          break;
        case 5:
          setXyroStatus("TRACKING");
          setMapCenter({ lat: 28.6295, lng: 77.3765 });
          setMapMarkers([{ id: "v", lat: 28.6295, lng: 77.3765, label: "Theft tracking: Noida Sec-62", type: "victim" }]);
          addLog("Live Tracking: GPS location streaming to Command Center.");
          break;
        case 6:
          setSelectedGuardianOption("YES");
          setMapMarkers([
            { id: "v", lat: 28.6295, lng: 77.3765, label: "Theft target", type: "victim" },
            { id: "g1", lat: 28.6225, lng: 77.3660, label: "Guardian Rahul (ETA 4m)", type: "guardian" }
          ]);
          setMapRoute([[28.6225, 77.3660], [28.6295, 77.3765]]);
          addLog("Guardian Grid: Rahul Singh (ETA 4m) responding.");
          break;
        case 7:
          setPolicePriority("HIGH");
          setMapMarkers([
            { id: "v", lat: 28.6295, lng: 77.3765, label: "Theft target", type: "victim" },
            { id: "g1", lat: 28.6225, lng: 77.3660, label: "Guardian Rahul", type: "guardian" },
            { id: "p1", lat: 28.6300, lng: 77.3650, label: "PCR CP-4 (ETA 2m)", type: "police" }
          ]);
          setMapRoute([[28.6225, 77.3660], [28.6295, 77.3765], [28.6300, 77.3650]]);
          addLog("Police: CP unit routed to interception site.");
          break;
        case 8:
          setEvidenceUploaded(true);
          setMapCenter({ lat: 28.6295, lng: 77.3765 });
          setMapMarkers([
            { id: "v", lat: 28.6295, lng: 77.3765, label: "Target Intercepted", type: "victim" },
            { id: "g1", lat: 28.6295, lng: 77.3765, label: "Guardian Rahul (Arrived)", type: "guardian" },
            { id: "p1", lat: 28.6295, lng: 77.3765, label: "PCR CP-4 (Arrived)", type: "police" }
          ]);
          setMapRoute([]);
          addLog("Interception complete. Device secured.");
          setIsPlaying(false);
          break;
      }

      const durations = [2000, 2000, 2000, 2500, 2500, 2500, 2500, 2500, 0];
      if (currentStep < 8) {
        timer = setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
        }, durations[currentStep]);
      } else {
        setIsPlaying(false);
      }
    };

    const runScreamOnly = () => {
      // Scream Only workflow
      switch (currentStep) {
        case 0:
          setVoiceState("NORMAL");
          setVoiceConfidence(1);
          setDetectedKeyword(null);
          setMapCenter({ lat: 28.6273, lng: 77.3725 });
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "Priya S. (Monitoring)", type: "victim" }]);
          setMapRoute([]);
          addLog("VoiceShield: Listening for panic triggers...");
          break;
        case 1:
          setVoiceState("SUSPICIOUS");
          setVoiceConfidence(38);
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "VoiceShield: Noise Anomaly", type: "victim" }]);
          addLog("VoiceShield: Ambient noise anomaly detected.");
          break;
        case 2:
          setVoiceState("EMERGENCY");
          setVoiceConfidence(98);
          setDetectedKeyword("BACHAO!");
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "VoiceShield: Screaming Detected", type: "victim" }]);
          addLog("VoiceShield Emergency: Distress scream 'BACHAO!' detected.");
          addNotification("🚨 VoiceShield: Emergency panic shout matched!");
          break;
        case 3:
          setCountdown(10);
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "Are you safe prompt active", type: "victim" }]);
          addLog("Verification Queue: 10s smart prompt loaded.");
          break;
        case 4:
          setCountdown(0);
          setMapMarkers([{ id: "v", lat: 28.6273, lng: 77.3725, label: "Audio Witness Syncing", type: "victim" }]);
          addLog("Recording active: Multi-channel audio witness locked.");
          break;
        case 5:
          setSelectedGuardianOption("YES");
          setMapMarkers([
            { id: "v", lat: 28.6273, lng: 77.3725, label: "Victim (Scream Alarm)", type: "victim" },
            { id: "g1", lat: 28.6225, lng: 77.3660, label: "Guardian Rahul (ETA 4m)", type: "guardian" }
          ]);
          setMapRoute([[28.6225, 77.3660], [28.6273, 77.3725]]);
          addLog("Guardians: Nearby responders alerted.");
          break;
        case 6:
          setPolicePriority("HIGH");
          setMapMarkers([
            { id: "v", lat: 28.6273, lng: 77.3725, label: "Victim (Scream Alarm)", type: "victim" },
            { id: "g1", lat: 28.6225, lng: 77.3660, label: "Guardian Rahul", type: "guardian" },
            { id: "p1", lat: 28.6300, lng: 77.3650, label: "PCR CP-4 (ETA 2m)", type: "police" }
          ]);
          setMapRoute([[28.6225, 77.3660], [28.6273, 77.3725], [28.6300, 77.3650]]);
          addLog("Police Command: Distress location shared. Patrol unit active.");
          break;
        case 7:
          setEvidenceUploaded(true);
          setMapMarkers([
            { id: "v", lat: 28.6273, lng: 77.3725, label: "Victim Secured", type: "victim" },
            { id: "g1", lat: 28.6273, lng: 77.3725, label: "Guardian Rahul (Arrived)", type: "guardian" },
            { id: "p1", lat: 28.6273, lng: 77.3725, label: "PCR CP-4 (Arrived)", type: "police" }
          ]);
          setMapRoute([]);
          addLog("Interception complete. Distress resolved.");
          setIsPlaying(false);
          break;
      }

      const durations = [2000, 2000, 2000, 2500, 2500, 2500, 2500, 0];
      if (currentStep < 7) {
        timer = setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
        }, durations[currentStep]);
      } else {
        setIsPlaying(false);
      }
    };

    if (simMode === "DUAL") runDualSimulation();
    else if (simMode === "SNATCH_ONLY") runSnatchOnly();
    else runScreamOnly();

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, simMode, addNotification, addLog]);

  // Countdown timer ticking
  useEffect(() => {
    if ((xyroStatus === "GRAB_DETECTED" || voiceState === "EMERGENCY") && countdown > 0) {
      const cTimer = setInterval(() => {
        setCountdown((c) => Math.max(0, c - 1));
      }, 1000);
      return () => clearInterval(cTimer);
    }
  }, [xyroStatus, voiceState, countdown]);

  // Render Kinematic Waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let offset = 0;
    canvas.width = 300;
    canvas.height = 80;

    const draw = () => {
      ctx.clearRect(0, 0, 300, 80);
      offset += 0.08;

      ctx.strokeStyle = xyroStatus === "SECURE" ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < 300; x += 15) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 80); ctx.stroke();
      }

      ctx.strokeStyle = xyroStatus === "SECURE"
        ? "#10b981"
        : xyroStatus === "SUSPICIOUS"
          ? "#eab308"
          : "#ef4444";
      ctx.lineWidth = 1.8;
      ctx.beginPath();

      for (let x = 0; x < 300; x++) {
        const rad = (x * 0.06) + offset;
        let amp = 5;
        if (xyroStatus === "SUSPICIOUS") amp = 14 + Math.sin(offset * 3) * 3;
        else if (xyroStatus === "GRAB_DETECTED" || xyroStatus === "SHUTDOWN" || xyroStatus === "TRACKING") {
          amp = 30 * (Math.sin(rad * 1.8) * Math.cos(rad * 0.3) + Math.random() * 0.1);
        }
        const y = 40 + Math.sin(rad) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [xyroStatus]);

  // Render VoiceShield Spectrogram/Acoustic wave
  useEffect(() => {
    const canvas = audioCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let offset = 0;
    canvas.width = 300;
    canvas.height = 80;

    const drawAudio = () => {
      ctx.clearRect(0, 0, 300, 80);
      offset += 0.12;

      ctx.strokeStyle = voiceState === "NORMAL" ? "rgba(6,182,212,0.05)" : "rgba(239,68,68,0.05)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < 300; x += 15) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 80); ctx.stroke();
      }

      // Draw acoustic wave
      ctx.strokeStyle = voiceState === "NORMAL"
        ? "#06b6d4"
        : voiceState === "SUSPICIOUS"
          ? "#eab308"
          : "#ef4444";
      ctx.lineWidth = 1.8;
      ctx.beginPath();

      for (let x = 0; x < 300; x++) {
        const rad = (x * 0.08) + offset;
        let amp = 3;
        if (voiceState === "SUSPICIOUS") amp = 12 + Math.cos(offset * 2) * 5;
        else if (voiceState === "EMERGENCY") {
          amp = 28 * (Math.sin(rad * 2.2) * Math.sin(rad * 0.5) + Math.random() * 0.15);
        }
        const y = 40 + Math.cos(rad) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      animId = requestAnimationFrame(drawAudio);
    };
    drawAudio();
    return () => cancelAnimationFrame(animId);
  }, [voiceState]);



  const handleSimTrigger = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setXyroStatus("SECURE");
    setVoiceState("NORMAL");
    setGripConfidence(99);
    setVoiceConfidence(2);
    setDetectedKeyword(null);
    setWatchHeartRate(72);
    setWatchSeparated(false);
    setCountdown(10);
    setPolicePriority("NORMAL");
    setSelectedGuardianOption(null);
    setEvidenceUploaded(false);
    setDeviceTrail([]);
    setTimelineLogs(["[05:15:00] TravelSafe X: Combined Escalation Engine online & monitoring."]);
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${isEmergency ? "grid-bg-emergency bg-[#0d0404]" : "grid-bg bg-[#050508]"} transition-colors duration-1000 pb-12 text-white`}>
      
      {/* Top HUD Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isEmergency ? "bg-red-500/20" : "bg-[#06b6d4]/20"}`}>
              <Shield size={14} className={isEmergency ? "text-red-400" : "text-cyan-400"} />
            </div>
            <span className="text-xs font-bold font-[family-name:var(--font-display)] text-white/95">
              TravelSafe X <span className="text-white/40">· VoiceShield™ + XyroShield™ Engine</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] px-2.5 py-1 rounded bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-cyan-400 font-mono text-[9px] font-bold">
            ESCALATION PROOF-OF-CONCEPT
          </span>
          <span className={`w-2.5 h-2.5 rounded-full ${isEmergency ? "bg-red-500 animate-pulse" : "bg-cyan-400"}`} />
        </div>
      </nav>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto pt-20 px-4 grid grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Simulation Control Panel & Visualizers */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          
          {/* Master Controller */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 scanlines pointer-events-none opacity-10" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <Zap size={14} className="text-amber-400" /> Escalation Controls
            </h3>

            {/* Simulation Modes */}
            <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-[9px] font-bold">
              {[
                { id: "DUAL", label: "Dual Trigger" },
                { id: "SNATCH_ONLY", label: "Snatch Only" },
                { id: "SCREAM_ONLY", label: "Voice Only" }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSimMode(m.id as "DUAL" | "SNATCH_ONLY" | "SCREAM_ONLY");
                    handleReset();
                  }}
                  disabled={isPlaying}
                  className={`py-1.5 px-1 rounded-lg uppercase tracking-wider text-center transition-all ${
                    simMode === m.id
                      ? "bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 font-extrabold"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSimTrigger}
                disabled={isPlaying}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 ${
                  isPlaying
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-cyan-600 border-red-500/20 text-white hover:glow-crimson"
                }`}
              >
                <Play size={12} /> Start Simulation
              </button>
              
              <button
                onClick={handleReset}
                className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all text-xs font-bold uppercase"
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Active Simulation Step HUD */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-white/40 uppercase">Sequence Status:</span>
                <span className={isPlaying ? "text-cyan-400 animate-pulse font-bold" : "text-white/40"}>
                  {isPlaying ? "ACTIVE SIM" : "STANDBY"}
                </span>
              </div>
              
              <h4 className="text-xs font-bold text-white leading-normal">
                {simMode === "DUAL" ? DUAL_SIMULATION_STEPS[currentStep].title : `Step ${currentStep + 1}`}
              </h4>
              <p className="text-[10px] text-white/50 leading-relaxed">
                {simMode === "DUAL" ? DUAL_SIMULATION_STEPS[currentStep].desc : "Demonstrating specific sensor escalation timeline."}
              </p>
            </div>
          </div>

          {/* AI Kinematic Visualizer Panel */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <Brain size={14} className="text-emerald-400" /> XyroShield™ Kinematics
            </h3>
            <div className="rounded-xl bg-black/50 border border-white/5 overflow-hidden p-2">
              <canvas ref={canvasRef} style={{ width: 300, height: 80 }} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-white/30 uppercase">Grip Confidence:</span>
              <span className={`font-bold ${gripConfidence >= 80 ? "text-emerald-400" : "text-red-400"}`}>
                {gripConfidence}%
              </span>
            </div>
          </div>

          {/* AI Acoustic Visualizer Panel (VoiceShield) */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                <Mic size={14} className="text-cyan-400" /> VoiceShield™ Acoustics
              </h3>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono ${
                voiceState === "EMERGENCY" ? "bg-red-500/20 text-red-400" : voiceState === "SUSPICIOUS" ? "bg-yellow-500/20 text-yellow-400" : "bg-cyan-500/20 text-cyan-400"
              }`}>
                {voiceState.toUpperCase()}
              </span>
            </div>
            <div className="rounded-xl bg-black/50 border border-white/5 overflow-hidden p-2">
              <canvas ref={audioCanvasRef} style={{ width: 300, height: 80 }} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-white/30 uppercase">Voice Threat Confidence:</span>
              <span className={`font-bold ${voiceConfidence >= 80 ? "text-red-400 animate-pulse" : "text-white/60"}`}>
                {voiceConfidence}%
              </span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Civilian App Preview & WatchSync */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col items-center gap-4">
          
          {/* Smartwatch Panel */}
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0f]/80 p-4 w-72 flex flex-col items-center shadow-lg">
            <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest self-start mb-2 flex items-center gap-1">
              <Volume2 size={10} /> WatchSync™ Backup
            </span>

            <div className={`w-32 h-36 rounded-[32px] border-4 bg-black flex flex-col justify-between p-3 text-center shadow-xl relative overflow-hidden transition-all duration-300 ${
              watchSeparated ? "border-red-500 scale-105 animate-pulse" : "border-zinc-700"
            }`}>
              <div className="flex items-center justify-between text-[6px] font-mono text-white/40">
                <span>TS-X Watch</span>
                <span className={watchSeparated ? "text-red-400 font-bold" : "text-emerald-400"}>
                  {watchSeparated ? "LOST LINK" : "SYNCED"}
                </span>
              </div>

              {watchSeparated ? (
                <div className="space-y-1 my-auto">
                  <span className="text-[8px] font-bold text-red-400 uppercase block tracking-wider animate-pulse">SEPARATED</span>
                  <p className="text-[7px] text-white/60 leading-none">TRIGGER BACKUP?</p>
                  <div className="flex justify-center gap-1 pt-1">
                    <button className="px-1.5 py-0.5 rounded bg-red-600 text-[5px] font-bold text-white uppercase">YES</button>
                    <button className="px-1.5 py-0.5 rounded bg-zinc-800 text-[5px] font-bold text-white/60 uppercase">NO</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 my-auto">
                  <div className="flex justify-center items-center gap-0.5 text-red-500 animate-pulse">
                    <Heart size={10} fill="currentColor" />
                    <span className="text-xs font-bold font-mono text-white">{watchHeartRate}</span>
                  </div>
                  <span className="text-[6px] text-white/30 uppercase block">WatchSync Syncing</span>
                </div>
              )}

              <div className="text-[6px] text-white/20 font-mono tracking-wider">Sec-62 Noida</div>
            </div>
          </div>

          {/* Civilian Phone Display */}
          <div className="relative w-72 h-[560px] rounded-[50px] border-[6px] border-zinc-800 bg-[#050508] shadow-2xl p-3 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black border border-white/5 flex items-center justify-center z-45">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0d0d16] border border-white/5 mr-10" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#050509]" />
            </div>

            <div className="flex-1 rounded-[40px] overflow-hidden bg-[#0c0c12] relative flex flex-col justify-between p-4 pt-8">
              
              <div className="flex items-center justify-between text-[8px] font-mono text-white/40">
                <span className="font-semibold">05:15 AM</span>
                <div className="flex items-center gap-1.5">
                  <Wifi size={10} className="text-emerald-400" />
                  <span className="px-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">5G</span>
                </div>
              </div>

              {/* Floating Status Badge */}
              <div className="absolute top-8 right-4 z-40">
                {xyroStatus === "SECURE" && voiceState === "NORMAL" && (
                  <span className="text-[7px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                    🟢 SECURE
                  </span>
                )}
                {(xyroStatus === "SUSPICIOUS" || voiceState === "SUSPICIOUS") && (
                  <span className="text-[7px] font-mono font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.3)] animate-pulse">
                    🟡 SUSPICIOUS
                  </span>
                )}
                {(xyroStatus === "GRAB_DETECTED" || voiceState === "EMERGENCY") && (
                  <span className="text-[7px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse">
                    🔴 GRAB DETECTED
                  </span>
                )}
                {xyroStatus === "SHUTDOWN" && (
                  <span className="text-[7px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-zinc-500">
                    ⚫ STEALTH
                  </span>
                )}
                {xyroStatus === "TRACKING" && (
                  <span className="text-[7px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)] animate-pulse">
                    📍 TRACKING
                  </span>
                )}
              </div>

              {/* Central Screens */}
              <div className="flex-1 flex flex-col justify-center py-4 text-center relative">
                
                {/* 1. Secure state */}
                {xyroStatus === "SECURE" && voiceState === "NORMAL" && (
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-full border border-dashed border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center mx-auto">
                      <Shield className="text-emerald-400" size={32} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">TravelSafe Active</h4>
                      <p className="text-[9px] text-white/30 uppercase mt-0.5">VoiceShield + XyroShield Sync</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 max-w-[190px] mx-auto text-left space-y-1 font-mono text-[8px] text-white/50">
                      <div>Status: <span className="text-emerald-400 font-bold">🟢 SECURE</span></div>
                      <div>Acoustic Sync: <span className="text-cyan-400">Stable</span></div>
                      <div>Grip Monitor: <span className="text-white">99% (Stable)</span></div>
                    </div>
                  </div>
                )}

                {/* 2. Suspicious */}
                {(xyroStatus === "SUSPICIOUS" || voiceState === "SUSPICIOUS") && (
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-full border border-dashed border-yellow-500/30 bg-yellow-500/5 flex items-center justify-center mx-auto animate-pulse">
                      <AlertTriangle className="text-yellow-500" size={32} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Acoustic/Grip Anomaly</h4>
                      <p className="text-[9px] text-white/30 uppercase mt-0.5">Threat Matrix Evaluating</p>
                    </div>
                  </div>
                )}

                {/* 3. Emergency trigger prompt */}
                {((xyroStatus === "GRAB_DETECTED" || voiceState === "EMERGENCY") && countdown > 0 && xyroStatus !== "SHUTDOWN" && xyroStatus !== "TRACKING") && (
                  <div className="space-y-4 flex flex-col items-center justify-center absolute inset-0 bg-[#0d0404] z-30 p-4 border border-red-500/20 rounded-[30px]">
                    <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center animate-pulse">
                      <ShieldAlert className="text-red-500 animate-bounce" size={24} />
                    </div>
                    
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-400">
                      HELP IS BEING REQUESTED
                    </h3>
                    <p className="text-[8px] text-white/40 max-w-[180px] mx-auto leading-normal">
                      Distress matched. Threat Confidence: 99%. Emergency dispatch pipeline starting in {countdown}s.
                    </p>

                    {detectedKeyword && (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 font-mono font-bold animate-pulse">
                        DISTRESS WORD: &quot;{detectedKeyword}&quot;
                      </span>
                    )}

                    <div className="w-full space-y-1 text-left text-[8px] font-mono text-white/50 bg-black/40 p-2.5 rounded-lg border border-red-500/10">
                      <div>✓ GPS Tracking: Active</div>
                      <div>✓ Evidence Rec: Recording</div>
                      <div>✓ Police Link: Initialized</div>
                    </div>

                    <button
                      onClick={() => {
                        handleReset();
                        setXyroStatus("SECURE");
                        setVoiceState("NORMAL");
                        setCountdown(10);
                        addLog("User confirmed safe. Alert cancelled. Returning to monitoring mode.");
                      }}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 text-[8px] font-bold uppercase tracking-wider hover:bg-emerald-500 transition-colors"
                    >
                      CANCEL ALERT (I&apos;M SAFE)
                    </button>
                  </div>
                )}

                {/* 4. Fake shutdown */}
                {xyroStatus === "SHUTDOWN" && (
                  <div className="space-y-3 flex flex-col items-center justify-center absolute inset-0 bg-[#020203] z-35 p-6">
                    <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
                    <span className="text-[9px] text-zinc-500 font-mono tracking-wider mt-2">Powering Off...</span>
                  </div>
                )}

                {/* 5. Tracking Reassurance overlay */}
                {xyroStatus === "TRACKING" && (
                  <div className="space-y-4 flex flex-col items-center justify-center absolute inset-0 bg-black z-35 p-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center mb-1 text-cyan-400">
                      <Shield className="animate-pulse" size={18} />
                    </div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-mono">🛡 HELP IS ON THE WAY</h4>
                    
                    <div className="w-full rounded-xl bg-zinc-950/80 border border-white/5 p-3 text-left space-y-1.5 text-[8px] font-mono text-white/60">
                      <div>Guardian: <span className="text-white font-bold">Rahul Singh</span></div>
                      <div>Trust Score: <span className="text-cyan-400 font-bold">98/100</span></div>
                      <div>Guardian ETA: <span className="text-cyan-400 font-bold">4 Minutes</span></div>
                      <div>Police Interceptor: <span className="text-purple-400 font-bold">CP CP-4 (8 min)</span></div>
                      <div className="border-t border-white/5 pt-1.5 mt-1 text-white/30 text-[6px] text-center leading-normal">
                        🎙 Audio Recording Active · Camera Active<br/>
                        Evidence cryptographically locked to blockchain.
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className="text-center text-[7px] text-white/20 select-none">
                VOICESHIELD AUTOMATIC SAFETY INFRASTRUCTURE
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Guardian Alert & Police command desk */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col gap-4">
          
          {/* Guardian Alert Screen */}
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0f]/95 p-4 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <UserCheck size={14} className="text-cyan-400" /> Guardian Response Protocol
            </h3>

            {isEmergency ? (
              <div className="p-3.5 rounded-xl border border-red-500/25 bg-red-950/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase font-mono tracking-wider animate-pulse">
                      🚨 CRITICAL EMERGENCY
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1">Victim: Priya Sharma</h4>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400">Distance: 1.2 KM</span>
                </div>

                <div className="text-[9px] font-mono text-white/50 space-y-0.5">
                  <div>Threat: <span className="text-red-400 font-bold">Phone Snatch + Scream Detected</span></div>
                  <div>Threat Confidence: <span className="text-red-400">99% (CRITICAL)</span></div>
                  <div>Location: <span className="text-white">Sector 62, Noida</span></div>
                </div>

                <div className="space-y-1.5 border-t border-white/5 pt-3">
                  <p className="text-[8px] text-white/40 uppercase tracking-widest font-mono">Can you respond to this emergency?</p>
                  
                  {selectedGuardianOption ? (
                    <div className="p-2 rounded bg-cyan-950/20 border border-cyan-500/20 text-center text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      Accepted: Rahul Singh Responding (ETA: 4m)
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setSelectedGuardianOption("YES")}
                        className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[9px] uppercase tracking-wider"
                      >
                        🟢 YES, I&apos;M GOING
                      </button>
                      <button
                        onClick={() => setSelectedGuardianOption("REMOTELY")}
                        className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white/60 font-bold text-[9px] uppercase tracking-wider"
                      >
                        🟡 MONITOR REMOTELY
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-white/5 bg-white/[0.01] text-center text-xs text-white/30 italic">
                No active emergency alerts in radius. Scanning...
              </div>
            )}
          </div>

          {/* Police Tactical Display */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <Landmark size={14} className="text-purple-400" /> Police Tactical Terminal
            </h3>

            {/* Tracking Map Canvas */}
            <div className="rounded-xl border border-white/5 bg-zinc-950 overflow-hidden h-44 relative">
              <InteractiveMap
                lat={mapCenter.lat}
                lng={mapCenter.lng}
                markers={mapMarkers}
                routeCoordinates={deviceTrail}
                lineColor="#ef4444"
                secondaryRouteCoordinates={mapRoute}
                secondaryLineColor="#eab308"
              />
            </div>

            {/* Active Reports / FIR summary */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/5 text-[9px] font-mono text-white/50 space-y-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>INCIDENT REPORT ID: #TSX-982</span>
                <span className={`px-1.5 py-0.5 rounded font-bold ${
                  policePriority === "CRITICAL" ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-zinc-800 text-white/40"
                }`}>
                  PRIORITY: {policePriority}
                </span>
              </div>

              {isEmergency ? (
                <div className="space-y-1 text-[8px] leading-relaxed">
                  <div><strong>Victim:</strong> Priya Sharma (Aadhaar Verified)</div>
                  <div><strong>Evidence Hub:</strong> {evidenceUploaded ? "🟢 Blockchain Upload Complete (Witness Signed)" : "🟡 Uploading audio/timeline logs..."}</div>
                  <div><strong>Nearest Station:</strong> Connaught Place / Sector 62</div>
                  <div><strong>Patrol Status:</strong> CP-4 Interceptor unit dispatched. ETA 8m.</div>
                  <div className="text-[7px] text-white/20 italic pt-1 border-t border-white/5 flex items-center gap-1">
                    <FileText size={10} /> Compliant with Section 154 Cr.P.C. (AI Auto-FIR compiled)
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-white/20 italic">No active reports. Command desk status clear.</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: Timeline Logs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="rounded-2xl border border-white/5 bg-[#07070a]/90 p-5 space-y-3 shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
            <FileText size={14} className="text-cyan-400" /> Operational System Timeline Logs
          </h3>

          <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 h-44 overflow-y-auto font-mono text-[10px] text-white/60 space-y-1.5 leading-relaxed">
            {timelineLogs.map((log, index) => {
              const isAlert = log.includes("CRITICAL") || log.includes("🚨") || log.includes("snatch") || log.includes("Distress");
              const isInfo = log.includes("SUCCESS") || log.includes("sync") || log.includes("Rahul") || log.includes("Police");
              return (
                <div
                  key={index}
                  className={`${isAlert ? "text-red-400 font-bold" : isInfo ? "text-cyan-400 font-semibold" : "text-white/60"}`}
                >
                  {log}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
