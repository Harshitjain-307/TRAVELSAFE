import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  SystemMode,
  GuardianNode,
  RouteData,
  EvidenceChunk,
  PeerUser,
  TimelineEvent,
  GrabSenseData,
  SafetyMetrics,
  EmergencyPacket,
  TrackingSnapshot,
  ResponderUpdatePayload,
} from "@/types";

export type UserPersona = "CIVILIAN" | "GUARDIAN" | "POLICE" | "ADMIN";

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
}

interface TravelSafeState {
  // Authentication & Persona
  userPersona: UserPersona | null;
  isAuthenticated: boolean;
  aadhaarNumber: string;
  mobileNumber: string;
  userName: string;
  trustScore: number;
  isVerifying: boolean;
  verificationStep: "INPUT" | "OTP" | "FACE" | "SUCCESS" | "BIOMETRIC";

  // System Mode & Core Simulation
  systemMode: SystemMode;
  isSimulating: boolean;
  sosCounter: number;
  metrics: SafetyMetrics;
  guardians: GuardianNode[];
  routes: RouteData[];
  evidence: EvidenceChunk[];
  peers: PeerUser[];
  timeline: TimelineEvent[];
  grabSense: GrabSenseData;
  emergencyPackets: EmergencyPacket[];
  threatLocation: { lat: number; lng: number } | null;
  interceptionRadius: number;
  firGenerated: boolean;
  evidenceRecording: boolean;

  // Guardian Portal
  activeGuardianMission: string | null;
  guardianRadarRange: number;
  guardianRankPoints: number;

  // Police Portal
  policeDispatchUnits: { id: string; name: string; status: "standby" | "dispatched" }[];

  // Admin Portal
  smartCityCctvActive: boolean;
  aadhaarQueue: { id: string; name: string; role: "GUARDIAN" | "POLICE"; approved: boolean }[];

  // Global Features
  theme: "dark" | "light";
  activeLanguage: "en" | "hi" | "ta" | "te";
  voiceAssistantActive: boolean;
  notifications: string[];
  chatMessages: ChatMessage[];

  // XyroShield Simulator State
  xyroGripConfidence: number;
  xyroStatus: "SECURE" | "SUSPICIOUS" | "GRAB_DETECTED" | "SHUTDOWN" | "TRACKING";
  watchHeartRate: number;
  watchSeparated: boolean;
  xyroCountdown: number;
  guardiansResponding: { id: string; name: string; eta: number; distance: number; trustScore: number; status: string }[];
  policePriority: "NORMAL" | "HIGH" | "CRITICAL";
  escalationStage: number;
  isXyroSimulating: boolean;

  // Live Responder Tracking (Socket.io)
  trackingConnected: boolean;
  trackingSnapshot: TrackingSnapshot | null;

  // Actions
  setUserPersona: (p: UserPersona | null) => void;
  setAuthStatus: (auth: boolean) => void;
  startVerification: () => void;
  setVerificationStep: (step: "INPUT" | "OTP" | "FACE" | "SUCCESS" | "BIOMETRIC") => void;
  setAadhaarDetails: (aadhaar: string, mobile: string, name?: string) => void;
  setSystemMode: (mode: SystemMode) => void;
  startThreatSimulation: () => void;
  stopThreatSimulation: () => void;
  tickSosCounter: () => void;
  updateMetrics: (metrics: Partial<SafetyMetrics>) => void;
  updateGrabSense: (data: Partial<GrabSenseData>) => void;
  addEmergencyPacket: (packet: EmergencyPacket) => void;
  activateTimelineStage: (stage: string) => void;

  // XyroShield Actions
  startXyroSimulation: () => void;
  stopXyroSimulation: () => void;
  updateXyroState: (data: Partial<TravelSafeState>) => void;
  tickXyroCountdown: () => void;

  // Role Actions
  acceptGuardianMission: (id: string | null) => void;
  dispatchPoliceUnit: (id: string, dispatch: boolean) => void;
  toggleCctv: () => void;
  approveAadhaarAccount: (id: string) => void;

  // Live Tracking Actions
  setTrackingConnected: (connected: boolean) => void;
  setTrackingSnapshot: (snapshot: TrackingSnapshot) => void;
  updateLiveResponder: (payload: ResponderUpdatePayload) => void;
  startLiveTrackingDemo: () => void;
  stopLiveTrackingDemo: () => void;

  // Global Actions
  toggleTheme: () => void;
  setLanguage: (lang: "en" | "hi" | "ta" | "te") => void;
  toggleVoiceAssistant: () => void;
  addNotification: (msg: string) => void;
  sendChatMessage: (msg: string, sender: string) => void;
}

const defaultGrabSense: GrabSenseData = {
  detectionConfidence: 94.7,
  threatProbability: 2.1,
  modelStatus: "online",
  biometricLock: true,
  inferenceLatency: 23,
  waveform: Array.from({ length: 60 }, (_, i) => Math.sin(i * 0.3) * 30 + Math.random() * 10),
  acceleration: Array.from({ length: 20 }, () => Math.random() * 2),
  orientation: { x: 0.02, y: -0.01, z: 0.98 },
};

const defaultGuardians: GuardianNode[] = [
  { id: "g1", name: "Guardian Alpha", distance: 0.3, status: "active", lat: 28.6139, lng: 77.209 },
  { id: "g2", name: "Guardian Beta", distance: 0.8, status: "standby", lat: 28.615, lng: 77.212 },
  { id: "g3", name: "Guardian Gamma", distance: 1.2, status: "active", lat: 28.611, lng: 77.205 },
  { id: "g4", name: "Guardian Delta", distance: 1.5, status: "standby", lat: 28.618, lng: 77.215 },
  { id: "g5", name: "Guardian Echo", distance: 2.1, status: "active", lat: 28.608, lng: 77.2 },
  { id: "g6", name: "Guardian Foxtrot", distance: 2.8, status: "standby", lat: 28.62, lng: 77.22 },
];

const defaultRoutes: RouteData[] = [
  {
    id: "r1",
    name: "Current Route",
    safetyScore: 87,
    lightingDensity: 78,
    crowdDensity: 65,
    incidentProbability: 12,
    duration: "18 min",
    distance: "4.2 km",
    coordinates: [
      [77.209, 28.6139],
      [77.212, 28.615],
      [77.215, 28.617],
      [77.218, 28.619],
    ],
    isActive: true,
  },
  {
    id: "r2",
    name: "Safer Alternate",
    safetyScore: 94,
    lightingDensity: 92,
    crowdDensity: 78,
    incidentProbability: 4,
    duration: "22 min",
    distance: "5.1 km",
    coordinates: [
      [77.209, 28.6139],
      [77.206, 28.616],
      [77.203, 28.618],
      [77.2, 28.62],
    ],
    isActive: false,
  },
];

const defaultEvidence: EvidenceChunk[] = [
  { id: "e1", type: "video", hash: "a3f8c2...9d1e", timestamp: "14:32:01", size: "2.4 MB", verified: true },
  { id: "e2", type: "audio", hash: "b7e4a1...3f8c", timestamp: "14:32:03", size: "128 KB", verified: true },
  { id: "e3", type: "video", hash: "c9d2f5...7a2b", timestamp: "14:32:05", size: "1.8 MB", verified: true },
];

const defaultPeers: PeerUser[] = [
  { id: "p1", name: "Priya S.", avatar: "PS", status: "journey", route: "Connaught Place", safetyScore: 91 },
  { id: "p2", name: "Arjun M.", avatar: "AM", status: "guardian", route: "Karol Bagh", safetyScore: 96 },
  { id: "p3", name: "Neha K.", avatar: "NK", status: "online", route: "Rajouri Garden", safetyScore: 88 },
  { id: "p4", name: "Rahul D.", avatar: "RD", status: "journey", route: "Dwarka", safetyScore: 85 },
];

const defaultTimeline: TimelineEvent[] = [
  { stage: "T-10", title: "Prediction", threatScore: 0, aiConfidence: 0, action: "Monitoring", timestamp: "--:--", active: false, completed: false },
  { stage: "T-0", title: "Detection", threatScore: 0, aiConfidence: 0, action: "Standby", timestamp: "--:--", active: false, completed: false },
  { stage: "+5", title: "Verification", threatScore: 0, aiConfidence: 0, action: "Pending", timestamp: "--:--", active: false, completed: false },
  { stage: "+15", title: "Resolution", threatScore: 0, aiConfidence: 0, action: "Pending", timestamp: "--:--", active: false, completed: false },
];

export const useTravelSafeStore = create<TravelSafeState>()(
  persist(
    (set, get) => ({
      // Authentication & Persona
      userPersona: null,
      isAuthenticated: false,
      aadhaarNumber: "",
      mobileNumber: "",
      userName: "Priya Sharma",
      trustScore: 98,
  isVerifying: false,
  verificationStep: "INPUT",

  // Core Simulation State
  systemMode: "SAFE",
  isSimulating: false,
  sosCounter: 0,
  metrics: {
    luminaScore: 92,
    guardianCount: 847,
    nearbyResponders: 12,
    responseTime: "3.2 min",
    activeThreats: 0,
    verifiedUsers: 12847,
  },
  guardians: defaultGuardians,
  routes: defaultRoutes,
  evidence: defaultEvidence,
  peers: defaultPeers,
  timeline: defaultTimeline,
  grabSense: defaultGrabSense,
  emergencyPackets: [],
  threatLocation: null,
  interceptionRadius: 0,
  firGenerated: false,
  evidenceRecording: false,

  // Guardian State
  activeGuardianMission: null,
  guardianRadarRange: 5,
  guardianRankPoints: 480,

  // Police State
  policeDispatchUnits: [
    { id: "u1", name: "Patrol unit CP-1", status: "standby" },
    { id: "u2", name: "Interceptor unit CP-4", status: "standby" },
    { id: "u3", name: "PCR Van Sector 7", status: "standby" },
  ],

  // Admin State
  smartCityCctvActive: true,
  aadhaarQueue: [
    { id: "q1", name: "Sub-Inspector Sandeep Kumar", role: "POLICE", approved: false },
    { id: "q2", name: "Anil Pathak (Volunteer)", role: "GUARDIAN", approved: false },
    { id: "q3", name: "Dr. Aarti Rao (Volunteer)", role: "GUARDIAN", approved: false },
  ],

  // Global Features
  theme: "dark",
  activeLanguage: "en",
  voiceAssistantActive: false,
  notifications: [
    "System Alert: GPS Safety mesh connected.",
    "LuminaMaps: Route CPS-2 lit score optimized.",
  ],
  chatMessages: [
    { sender: "System Control", text: "Security Infrastructure Active.", time: "04:38" },
  ],

  // XyroShield Simulator State
  xyroGripConfidence: 99,
  xyroStatus: "SECURE",
  watchHeartRate: 72,
  watchSeparated: false,
  xyroCountdown: 10,
  guardiansResponding: [],
  policePriority: "NORMAL",
  escalationStage: 0,
  isXyroSimulating: false,

  // Live Tracking
  trackingConnected: false,
  trackingSnapshot: null,

  // Actions
  setUserPersona: (p) => set({ userPersona: p }),
  setAuthStatus: (auth) => set({ isAuthenticated: auth }),
  startVerification: () => set({ isVerifying: true, verificationStep: "INPUT" }),
  setVerificationStep: (step) => set({ verificationStep: step }),
  setAadhaarDetails: (aadhaar, mobile, name) => set({ aadhaarNumber: aadhaar, mobileNumber: mobile, userName: name || "Priya Sharma" }),

  setSystemMode: (mode) => set({ systemMode: mode }),

  startThreatSimulation: () => {
    set({
      isSimulating: true,
      systemMode: "ALERT",
      sosCounter: 0,
      threatLocation: { lat: 28.6145, lng: 77.211 },
      interceptionRadius: 500,
      firGenerated: false,
      evidenceRecording: false,
      emergencyPackets: [],
      timeline: defaultTimeline.map((t) => ({ ...t })),
      grabSense: {
        ...defaultGrabSense,
        threatProbability: 78.4,
        detectionConfidence: 96.2,
        modelStatus: "alert",
      },
      metrics: {
        luminaScore: 34,
        guardianCount: 847,
        nearbyResponders: 12,
        responseTime: "1.8 min",
        activeThreats: 1,
        verifiedUsers: 12847,
      },
      guardians: defaultGuardians.map((g, i) => ({
        ...g,
        status: i < 3 ? ("responding" as const) : ("active" as const),
      })),
      chatMessages: [
        { sender: "System Control", text: "WARNING: Kinematic anomaly detected.", time: "04:41" },
        { sender: "Priya S. (Victim)", text: "Help! Someone is following me CP Sector 7.", time: "04:41" },
      ],
    });

    const stages = [
      { stage: "T-10", threatScore: 72, aiConfidence: 89, action: "AI Prediction Triggered", delay: 500 },
      { stage: "T-0", threatScore: 91, aiConfidence: 96, action: "Grab-Sense Anomaly Detected", delay: 2000 },
      { stage: "+5", threatScore: 94, aiConfidence: 98, action: "Guardian Mesh Activated", delay: 4000 },
      { stage: "+15", threatScore: 88, aiConfidence: 97, action: "Response Team En Route", delay: 7000 },
    ];

    stages.forEach(({ stage, threatScore, aiConfidence, action, delay }) => {
      setTimeout(() => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
        set((state) => ({
          timeline: state.timeline.map((t) =>
            t.stage === stage
              ? { ...t, threatScore, aiConfidence, action, timestamp: timeStr, active: true, completed: true }
              : t
          ),
        }));
      }, delay);
    });

    setTimeout(() => {
      set({ systemMode: "ESCALATION" });
      get().addNotification("SOS Alert Broadcasted to 847 Nearby Guardians.");
    }, 3000);
    
    setTimeout(() => {
      set({ systemMode: "SOS", evidenceRecording: true });
      get().addNotification("Shadow Witness: Evidence encrypted and locked to blockchain ledger.");
    }, 5000);

    setTimeout(() => {
      set({ firGenerated: true });
      get().addNotification("System Control: AI Auto-FIR draft generated for Police verification.");
    }, 6000);

    setTimeout(() => {
      set({ systemMode: "RESPONSE" });
      get().addNotification("Police Dispatch: 2 patrol units routed for interception.");
    }, 9000);
  },

  stopThreatSimulation: () => {
    set({
      isSimulating: false,
      systemMode: "SAFE",
      sosCounter: 0,
      threatLocation: null,
      interceptionRadius: 0,
      firGenerated: false,
      evidenceRecording: false,
      emergencyPackets: [],
      activeGuardianMission: null,
      timeline: defaultTimeline.map((t) => ({ ...t })),
      grabSense: defaultGrabSense,
      metrics: {
        luminaScore: 92,
        guardianCount: 847,
        nearbyResponders: 12,
        responseTime: "3.2 min",
        activeThreats: 0,
        verifiedUsers: 12847,
      },
      guardians: defaultGuardians,
      policeDispatchUnits: [
        { id: "u1", name: "Patrol unit CP-1", status: "standby" },
        { id: "u2", name: "Interceptor unit CP-4", status: "standby" },
        { id: "u3", name: "PCR Van Sector 7", status: "standby" },
      ],
      chatMessages: [
        { sender: "System Control", text: "Security Infrastructure Active.", time: "04:38" },
      ],
    });
    get().addNotification("Emergency simulation terminated. System returned to Safe Mode.");
  },

  tickSosCounter: () => {
    if (get().isSimulating) {
      set((state) => ({ sosCounter: state.sosCounter + 1 }));
    }
  },

  updateMetrics: (metrics) =>
    set((state) => ({ metrics: { ...state.metrics, ...metrics } })),

  updateGrabSense: (data) =>
    set((state) => ({ grabSense: { ...state.grabSense, ...data } })),

  addEmergencyPacket: (packet) =>
    set((state) => ({
      emergencyPackets: [packet, ...state.emergencyPackets].slice(0, 20),
    })),

  activateTimelineStage: (stage) =>
    set((state) => ({
      timeline: state.timeline.map((t) =>
        t.stage === stage ? { ...t, active: true, completed: true } : t
      ),
    })),

  // Guardian Mission Acceptance
  acceptGuardianMission: (id) => {
    set({ activeGuardianMission: id });
    if (id) {
      get().addNotification("Guardian Accepted Incident Mission. Live GPS tracking started.");
      set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          { sender: "Guardian Responder", text: "🟢 YES, I'M GOING — Live coordinates shared. ETA updating.", time: "04:42" },
        ],
      }));
    }
  },

  // Police Dispatch
  dispatchPoliceUnit: (id, dispatch) => {
    set((state) => ({
      policeDispatchUnits: state.policeDispatchUnits.map((u) =>
        u.id === id ? { ...u, status: dispatch ? ("dispatched" as const) : ("standby" as const) } : u
      ),
    }));
    const unitName = get().policeDispatchUnits.find((u) => u.id === id)?.name;
    get().addNotification(`Police Command: ${unitName} has been ${dispatch ? "DISPATCHED" : "RECALLED"}.`);
    if (dispatch) {
      set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          { sender: "Police Dispatch", text: `${unitName} en route to Delhi NCR CP Sector 7. ETA 1.8 mins.`, time: "04:43" },
        ],
      }));
    }
  },

  // Admin CCTV Toggle
  toggleCctv: () => set((state) => ({ smartCityCctvActive: !state.smartCityCctvActive })),

  // Admin Account Approval
  approveAadhaarAccount: (id) => {
    set((state) => ({
      aadhaarQueue: state.aadhaarQueue.map((item) =>
        item.id === id ? { ...item, approved: true } : item
      ),
    }));
    const userName = get().aadhaarQueue.find((i) => i.id === id)?.name;
    get().addNotification(`Admin Tower: Approved Aadhaar credentials for ${userName}.`);
  },

  // XyroShield Actions
  startXyroSimulation: () => set({
    isXyroSimulating: true,
    xyroStatus: "SECURE",
    xyroGripConfidence: 99,
    watchHeartRate: 72,
    watchSeparated: false,
    xyroCountdown: 10,
    guardiansResponding: [],
    policePriority: "NORMAL",
    escalationStage: 0,
  }),
  stopXyroSimulation: () => {
    set({
      isXyroSimulating: false,
      xyroStatus: "SECURE",
      xyroGripConfidence: 99,
      watchHeartRate: 72,
      watchSeparated: false,
      xyroCountdown: 10,
      guardiansResponding: [],
      policePriority: "NORMAL",
      escalationStage: 0,
    });
    get().addNotification("XyroShield: Simulation reset. Returned to secure monitoring.");
  },
  updateXyroState: (data) => set((state) => ({ ...state, ...data })),
  tickXyroCountdown: () => set((state) => ({
    xyroCountdown: Math.max(0, state.xyroCountdown - 1)
  })),

  // Live Tracking
  setTrackingConnected: (connected) => set({ trackingConnected: connected }),

  setTrackingSnapshot: (snapshot) => set({ trackingSnapshot: snapshot }),

  updateLiveResponder: (payload) =>
    set((state) => {
      if (!state.trackingSnapshot?.incident) return state;
      const responders = state.trackingSnapshot.incident.responders.map((r) =>
        r.id === payload.responderId
          ? {
              ...r,
              lat: payload.lat,
              lng: payload.lng,
              speed: payload.speed,
              direction: payload.direction,
              distanceKm: payload.distanceKm,
              etaMinutes: payload.etaMinutes,
              routeProgress: payload.routeProgress / 100,
              status: payload.status,
            }
          : r
      );
      return {
        trackingSnapshot: {
          ...state.trackingSnapshot,
          incident: { ...state.trackingSnapshot.incident, responders },
          responders,
        },
      };
    }),

  startLiveTrackingDemo: () => {
    get().addNotification("🚨 Live Tracking Demo: Emergency triggered — responders routing.");
  },

  stopLiveTrackingDemo: () => {
    set({ trackingSnapshot: null });
    get().addNotification("Live tracking simulation stopped.");
  },

  // Global Settings Toggle
  toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  setLanguage: (lang) => set({ activeLanguage: lang }),
  toggleVoiceAssistant: () => set((state) => ({ voiceAssistantActive: !state.voiceAssistantActive })),

  addNotification: (msg) => {
    set((state) => ({
      notifications: [msg, ...state.notifications].slice(0, 10),
    }));
  },

  sendChatMessage: (msg, sender) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        { sender, text: msg, time: timeStr },
      ],
    }));
  },
}), {
  name: "travelsafe-persist-storage",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    userPersona: state.userPersona,
    isAuthenticated: state.isAuthenticated,
    aadhaarNumber: state.aadhaarNumber,
    mobileNumber: state.mobileNumber,
    userName: state.userName,
    trustScore: state.trustScore,
    theme: state.theme,
    activeLanguage: state.activeLanguage,
  }),
})
);
