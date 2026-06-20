"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Compass, Building, Heart, Clock, Route, Radio, Users, CheckCircle2, X, Crosshair, Play, Sparkles } from "lucide-react";
import { useTravelSafeStore } from "@/store/useTravelSafeStore";
import { isTrackingActive } from "@/lib/tracking";
import type { MapMarker } from "@/types";
import dynamic from "next/dynamic";
import { fetchRoadRouteWithWaypoint, fetchAlternativeRoutes } from "@/lib/osrmService";

const InteractiveMap = dynamic(() => import("@/components/ui/InteractiveMap"), {
  ssr: false,
});

const LiveTrackingMap = dynamic(() => import("@/components/tracking/LiveTrackingMap"), {
  ssr: false,
});

// Seed Delhi NCR Places for operational geocoding autocomplete
const OPERATIONAL_PLACES = [
  { name: "Connaught Place, Block B", lat: 28.6304, lng: 77.2177, type: "landmark", score: 94 },
  { name: "Noida Metro Station Sector 62", lat: 28.6273, lng: 77.3725, type: "metro", score: 92 },
  { name: "Siri Fort Auditorium, Khel Gaon", lat: 28.5562, lng: 77.2198, type: "landmark", score: 98 },
  { name: "AIIMS Trauma Center, Ansari Nagar", lat: 28.6080, lng: 77.2050, type: "hospital", score: 96 },
  { name: "Fortis Escorts Hospital", lat: 28.6270, lng: 77.2140, type: "hospital", score: 95 },
  { name: "CP Police Station", lat: 28.6310, lng: 77.2190, type: "police", score: 97 },
  { name: "TravelSafe Guard Hub #03", lat: 28.6280, lng: 77.2220, type: "hub", score: 98 },
  { name: "Noida Metro Hospital", lat: 28.6270, lng: 77.3640, type: "hospital", score: 94 }
];

// Helper to build step-by-step street grid turns matching city blocks
function buildRoadCoordinates(
  start: [number, number],
  end: [number, number],
  routeType: "recommended" | "safest" | "fastest"
): [number, number][] {
  const coords: [number, number][] = [];
  const startLat = start[0];
  const startLng = start[1];
  const endLat = end[0];
  const endLng = end[1];

  let junctions: [number, number][] = [];

  // Noida Sector 62 route
  if (Math.abs(endLng - 77.3725) < 0.02) {
    if (routeType === "safest") {
      junctions = [
        [28.6304, 77.2177], // CP
        [28.6250, 77.2350], // Mandi House
        [28.6180, 77.2500], // Pragati Maidan
        [28.5900, 77.2750], // DND Flyway Entrance
        [28.5920, 77.3200], // Mayur Vihar Link
        [28.6150, 77.3550], // Noida Sector 62 Bypass
        [28.6273, 77.3725]  // Sec 62 Metro
      ];
    } else if (routeType === "fastest") {
      junctions = [
        [28.6304, 77.2177],
        [28.6280, 77.2550], // Vikas Marg
        [28.6290, 77.3000], // Preet Vihar
        [28.6220, 77.3400], // Ghazipur Border
        [28.6273, 77.3725]
      ];
    } else { // recommended
      junctions = [
        [28.6304, 77.2177],
        [28.6220, 77.2400], // Barakhamba Rd
        [28.6150, 77.2800], // Akshardham Temple highway
        [28.6200, 77.3300], // Patparganj industrial
        [28.6273, 77.3725]
      ];
    }
  } 
  // Siri Fort route
  else if (Math.abs(endLat - 28.5562) < 0.02) {
    if (routeType === "safest") {
      junctions = [
        [28.6304, 77.2177],
        [28.6150, 77.2180], // Janpath Road
        [28.5920, 77.2220], // Lodhi Road
        [28.5750, 77.2240], // Khel Gaon Marg
        [28.5562, 77.2198]
      ];
    } else if (routeType === "fastest") {
      junctions = [
        [28.6304, 77.2177],
        [28.6050, 77.2100], // Chanakyapuri bypass
        [28.5800, 77.2110], // Safdarjung Road
        [28.5562, 77.2198]
      ];
    } else {
      junctions = [
        [28.6304, 77.2177],
        [28.6100, 77.2220], // India Gate Circle
        [28.5850, 77.2280], // Humayun Tomb Bypass
        [28.5562, 77.2198]
      ];
    }
  }
  // Fallback / other places
  else {
    // Generate a default curved path with turns to follow actual road networks
    const midLat = startLat + (endLat - startLat) * 0.45;
    const midLng = startLng + (endLng - startLng) * 0.55;
    junctions = [
      start,
      [midLat, startLng],
      [midLat, midLng],
      [endLat, midLng],
      end
    ];
  }

  // Interpolate intermediate coordinates between junctions to make the path smooth and follow roads
  for (let i = 0; i < junctions.length - 1; i++) {
    const ptA = junctions[i];
    const ptB = junctions[i + 1];
    const steps = 8;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      coords.push([
        ptA[0] + (ptB[0] - ptA[0]) * t,
        ptA[1] + (ptB[1] - ptA[1]) * t
      ]);
    }
  }
  coords.push(end);
  return coords;
}

function buildRoadRoute(
  start: [number, number],
  end: [number, number],
  routeType: "recommended" | "safest" | "fastest",
  waypoint: { lat: number; lng: number } | null
): [number, number][] {
  if (waypoint) {
    const segment1 = buildRoadCoordinates(start, [waypoint.lat, waypoint.lng], routeType);
    const segment2 = buildRoadCoordinates([waypoint.lat, waypoint.lng], end, routeType);
    return [...segment1, ...segment2];
  }
  return buildRoadCoordinates(start, end, routeType);
}

export function MapTab() {
  const systemMode = useTravelSafeStore((s) => s.systemMode);
  const trackingSnapshot = useTravelSafeStore((s) => s.trackingSnapshot);
  const isEmergency = systemMode !== "SAFE";
  const trackingActive = isTrackingActive(trackingSnapshot);

  // Search & suggestions states
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof OPERATIONAL_PLACES>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Connaught Place, Block B",
    "Noida Metro Station Sector 62",
    "Siri Fort Auditorium"
  ]);
  const [selectedDest, setSelectedDest] = useState<typeof OPERATIONAL_PLACES[0] | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<"recommended" | "safest" | "fastest">("recommended");
  const [showRecents, setShowRecents] = useState(false);
interface CoPassenger {
    name: string;
    distance: number;
    direction: string;
    trustScore: number;
    travelPattern: string;
    mutualRoute: string;
    status: string;
  }

  const [selectedCoPassenger, setSelectedCoPassenger] = useState<CoPassenger | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<{
    id: string;
    lat: number;
    lng: number;
    type?: string;
    label?: string;
    name?: string;
    distance?: string;
    eta?: string;
    safetyScore?: number;
  } | null>(null);
  
  // Custom interactive route adjustments
  const [waypoint, setWaypoint] = useState<{ lat: number; lng: number } | null>(null);
  const [isAdjustMode, setIsAdjustMode] = useState(false);

  // Widescreen Map HUD layout states
  const [isWidescreenHUD, setIsWidescreenHUD] = useState(false);
  const [hudStyle, setHudStyle] = useState<"dark" | "light" | "satellite">("dark");
  const [mapHeading, setMapHeading] = useState(0);

  // Journey Simulation State
  const [isJourneySimActive, setIsJourneySimActive] = useState(false);
  const [simProgress, setSimProgress] = useState(0); // 0 to 1
  const [simSpeed, setSimSpeed] = useState(48); // km/h
  const [simDistance, setSimDistance] = useState(14.2); // km
  const [simEta, setSimEta] = useState(24); // min
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // OSRM states
  const [calculatedRouteCoords, setCalculatedRouteCoords] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState(14.2);
  const [routeEta, setRouteEta] = useState(24);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [shouldAutoStartSim, setShouldAutoStartSim] = useState(false);

  // Home & Office presets
  const homeLoc = { name: "Home (CP External Circular Rd)", lat: 28.6312, lng: 77.2201, type: "home", score: 95 };
  const officeLoc = { name: "Office (Noida Sector 62, Fortis Block)", lat: 28.6278, lng: 77.3731, type: "office", score: 92 };

  // Simulated Co-Passengers on same route
  const coPassengers = [
    { name: "Arjun", distance: 150, direction: "Same Route", trustScore: 94, travelPattern: "Daily Commuter", mutualRoute: "Noida Sec-62 Metro Line", status: "Travelling" },
    { name: "Neha", distance: 300, direction: "Converging", trustScore: 96, travelPattern: "Student Route", mutualRoute: "Noida Sec-62 Metro Line", status: "Travelling" }
  ];

  // Smart cluster data
  const safeTravelClusterCount = 5;

  // Search input typing handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 1) {
      const filtered = OPERATIONAL_PLACES.filter(place =>
        place.name.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
      setShowRecents(false);
    } else {
      setSuggestions([]);
      setShowRecents(true);
    }
  };

  // Select place from suggestions or bookmarks
  const selectPlace = (place: typeof OPERATIONAL_PLACES[0]) => {
    setSelectedDest(place);
    setSearchQuery(place.name);
    setSuggestions([]);
    setShowRecents(false);
    setWaypoint(null);
    setSimProgress(0);
    setIsJourneySimActive(false);
    
    // Add to recent searches
    if (!recentSearches.includes(place.name)) {
      setRecentSearches(prev => [place.name, ...prev.slice(0, 4)]);
    }
  };

  // Start Journey Simulation loop
  const startJourneySimulation = () => {
    if (isJourneySimActive) {
      // Pause
      setIsJourneySimActive(false);
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      return;
    }

    setIsJourneySimActive(true);
    setSimProgress(0);
    setSimSpeed(48);
    setSimDistance(routeDistance);
    setSimEta(routeEta);

    simTimerRef.current = setInterval(() => {
      setSimProgress((prev) => {
        const next = prev + 0.015;
        if (next >= 1) {
          clearInterval(simTimerRef.current!);
          setIsJourneySimActive(false);
          return 1;
        }
        // Update stats dynamically
        setSimDistance(parseFloat((routeDistance * (1 - next)).toFixed(1)));
        setSimEta(Math.ceil(routeEta * (1 - next)));
        setSimSpeed(Math.floor(40 + Math.random() * 12));
        return next;
      });
    }, 1000);
  };

  const endJourneySimulation = () => {
    setIsJourneySimActive(false);
    setSimProgress(0);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setWaypoint(null);
    setShouldAutoStartSim(false);
  };

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  // Fetch real road routing using OSRM client-side service
  useEffect(() => {
    if (!selectedDest) {
      setCalculatedRouteCoords([]);
      return;
    }

    const startCoords: [number, number] = [28.6304, 77.2177];
    const destCoords: [number, number] = [selectedDest.lat, selectedDest.lng];

    let active = true;
    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      try {
        let dist = 14.2;
        let eta = 24;
        let coords: [number, number][] = [];

        if (waypoint) {
          const res = await fetchRoadRouteWithWaypoint(
            startCoords[0],
            startCoords[1],
            waypoint.lat,
            waypoint.lng,
            destCoords[0],
            destCoords[1]
          );
          coords = res.coordinates;
          dist = res.distanceKm;
          eta = res.durationMinutes;
        } else {
          const res = await fetchAlternativeRoutes(
            startCoords[0],
            startCoords[1],
            destCoords[0],
            destCoords[1]
          );
          const selected = res[selectedRoute];
          coords = selected.coordinates;
          dist = selected.distanceKm;
          eta = selected.durationMinutes;
        }

        if (active) {
          setCalculatedRouteCoords(coords);
          setRouteDistance(dist);
          setRouteEta(eta);
          setSimDistance(dist);
          setSimEta(eta);

          if (shouldAutoStartSim) {
            setShouldAutoStartSim(false);
            setIsJourneySimActive(true);
            setSimProgress(0);
            setSimSpeed(35);
            
            if (simTimerRef.current) clearInterval(simTimerRef.current);
            simTimerRef.current = setInterval(() => {
              setSimProgress((prev) => {
                const next = prev + 0.015;
                if (next >= 1) {
                  clearInterval(simTimerRef.current!);
                  setIsJourneySimActive(false);
                  return 1;
                }
                setSimDistance(parseFloat((dist * (1 - next)).toFixed(1)));
                setSimEta(Math.ceil(eta * (1 - next)));
                setSimSpeed(Math.floor(35 + Math.random() * 10));
                return next;
              });
            }, 1000);
          }
        }
      } catch (err) {
        console.error("Error fetching road route:", err);
        if (active) {
          const fallback = buildRoadRoute(startCoords, destCoords, selectedRoute, waypoint);
          const dist = selectedRoute === "safest" ? 17.5 : selectedRoute === "fastest" ? 12.1 : 14.2;
          const eta = selectedRoute === "safest" ? 28 : selectedRoute === "fastest" ? 18 : 24;
          
          setCalculatedRouteCoords(fallback);
          setRouteDistance(dist);
          setRouteEta(eta);
          setSimDistance(dist);
          setSimEta(eta);

          if (shouldAutoStartSim) {
            setShouldAutoStartSim(false);
            setIsJourneySimActive(true);
            setSimProgress(0);
            setSimSpeed(35);
            
            if (simTimerRef.current) clearInterval(simTimerRef.current);
            simTimerRef.current = setInterval(() => {
              setSimProgress((prev) => {
                const next = prev + 0.015;
                if (next >= 1) {
                  clearInterval(simTimerRef.current!);
                  setIsJourneySimActive(false);
                  return 1;
                }
                setSimDistance(parseFloat((dist * (1 - next)).toFixed(1)));
                setSimEta(Math.ceil(eta * (1 - next)));
                setSimSpeed(Math.floor(35 + Math.random() * 10));
                return next;
              });
            }, 1000);
          }
        }
      } finally {
        if (active) setIsLoadingRoute(false);
      }
    };

    fetchRoute();

    return () => {
      active = false;
    };
  }, [selectedDest, selectedRoute, waypoint, shouldAutoStartSim]);

  // Map markers for map rendering
  const mapMarkers: MapMarker[] = [];
  const startCoords: [number, number] = [28.6304, 77.2177];
  // const destCoords: [number, number] = selectedDest ? [selectedDest.lat, selectedDest.lng] : startCoords; // Unused
  
  // Calculate road snaps

  // User current simulated position
  const currentCoords = selectedDest
    ? (calculatedRouteCoords[Math.floor(simProgress * (calculatedRouteCoords.length - 1))] || startCoords)
    : startCoords;

  const mapCenterLat = selectedDest ? selectedDest.lat : startCoords[0];
  const mapCenterLng = selectedDest ? selectedDest.lng : startCoords[1];

  if (selectedDest) {
    // Start marker
    mapMarkers.push({
      id: "start",
      lat: startCoords[0],
      lng: startCoords[1],
      label: "Start: Connaught Place",
      type: "safezone"
    });

    // Destination marker
    mapMarkers.push({
      id: "dest",
      lat: selectedDest.lat,
      lng: selectedDest.lng,
      label: `Destination: ${selectedDest.name}`,
      type: isEmergency ? "victim" : "safezone"
    });

    // Active User marker (moves along road)
    mapMarkers.push({
      id: "user-loc",
      lat: currentCoords[0],
      lng: currentCoords[1],
      label: "👤 Priya (Your Current Location)",
      type: "victim"
    });

    // Add co-passengers as map markers
    coPassengers.forEach((p, idx) => {
      mapMarkers.push({
        id: `copassenger-${idx}`,
        lat: selectedDest.lat - 0.002 - idx * 0.001,
        lng: selectedDest.lng - 0.001 + idx * 0.002,
        label: `👤 Co-Traveller: ${p.name} (Trust Score: ${p.trustScore})`,
        type: "guardian"
      });
    });
  }

  // Safe haven navigation & Start trip simulation automatically
  const navigateToHaven = (havenName: string, lat: number, lng: number) => {
    const haven = { name: havenName, lat, lng, type: "haven", score: 98 };
    setShouldAutoStartSim(true);
    selectPlace(haven);
  };

  const handleMarkerClick = (markerId: string) => {
    const foundMarker = mapMarkers.find(m => m.id === markerId);
    if (!foundMarker) return;

    const nameClean = foundMarker.label.replace("Destination: ", "").replace("Start: ", "");
    const placeInfo = OPERATIONAL_PLACES.find(p => p.name.includes(nameClean)) || { score: 95 };

    setSelectedMarker({
      id: foundMarker.id,
      name: foundMarker.label,
      lat: foundMarker.lat,
      lng: foundMarker.lng,
      distance: foundMarker.id === "start" ? "0m" : foundMarker.id === "dest" ? `${simDistance} km` : "450m",
      eta: foundMarker.id === "start" ? "0m" : foundMarker.id === "dest" ? `${simEta} min` : "4 min",
      safetyScore: placeInfo.score,
    });
  };

  const getWaypointName = (wp: { lat: number; lng: number }) => {
    const latDiff = wp.lat - startCoords[0];
    const lngDiff = wp.lng - startCoords[1];
    if (Math.abs(latDiff) > Math.abs(lngDiff)) {
      return wp.lat > startCoords[0] ? "KG Marg N-Intersection Road" : "Connaught Outer Circle Bypass";
    } else {
      return wp.lng > startCoords[1] ? "Noida Sector 62 Link Expressway" : "Siri Fort Road Link";
    }
  };

  // Rotating compass heading
  const rotateCompass = () => {
    setMapHeading((prev) => (prev + 45) % 360);
  };

  // Fullscreen maximized HUD layout
  if (isWidescreenHUD) {
    return (
      <div className={`fixed inset-0 z-50 ${isEmergency ? "bg-[#0f0404]" : "bg-[#040407]"} text-white flex flex-col justify-between overflow-hidden select-none`}>
        {/* Fullscreen Map Canvas */}
        <div className="absolute inset-0 z-10">
          {trackingActive ? (
            <LiveTrackingMap snapshot={trackingSnapshot} viewMode="civilian" height="100vh" showLegend={false} showProgress={true} />
          ) : (
            <InteractiveMap
              lat={mapCenterLat}
              lng={mapCenterLng}
              zoom={selectedDest ? 14 : 12}
              markers={mapMarkers}
              routeCoordinates={calculatedRouteCoords}
              lineColor={
                isEmergency
                  ? "#ef4444"
                  : selectedRoute === "fastest"
                  ? "#10b981"
                  : selectedRoute === "safest"
                  ? "#3b82f6"
                  : "#fbbf24"
              }
              routeProgress={simProgress}
              mapStyle={hudStyle}
              isEmergency={isEmergency}
              waypoint={waypoint}
              onMapClick={(lat, lng) => {
                if (isAdjustMode) setWaypoint({ lat, lng });
              }}
              onWaypointDrag={(lat, lng) => {
                setWaypoint({ lat, lng });
              }}
              onMarkerClick={handleMarkerClick}
            />
          )}

          {/* Floating Marker detail card for Widescreen */}
          {selectedMarker && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-72 bg-zinc-950/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">{selectedMarker.name}</h4>
                  <p className="text-[8px] text-cyan-400 mt-0.5 font-mono">MAP INFRASTRUCTURE NODE</p>
                </div>
                <button onClick={() => setSelectedMarker(null)} className="text-white/40 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono bg-black/40 p-2 rounded-xl border border-white/5">
                <div>
                  <span className="text-white/35 block uppercase text-[7px]">Distance</span>
                  <span className="text-white font-bold">{selectedMarker.distance}</span>
                </div>
                <div>
                  <span className="text-white/35 block uppercase text-[7px]">ETA</span>
                  <span className="text-white font-bold">{selectedMarker.eta}</span>
                </div>
                <div>
                  <span className="text-white/35 block uppercase text-[7px]">Safety</span>
                  <span className="text-emerald-400 font-bold">{selectedMarker.safetyScore}%</span>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    navigateToHaven(selectedMarker.name || selectedMarker.id, selectedMarker.lat, selectedMarker.lng);
                    setSelectedMarker(null);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-[10px] font-bold text-white uppercase tracking-wider transition-all"
                >
                  Navigate
                </button>
                <button
                  onClick={() => alert(`Details: Node is active and monitored by Merkle proof ledger. Coordinates: ${selectedMarker.lat}, ${selectedMarker.lng}`)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/80 transition-all uppercase"
                >
                  Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 1. TOP LEFT: GPS SIGNAL STATUS */}
        <div className="absolute top-4 left-4 z-20 glass-panel p-3 rounded-xl min-w-[190px] border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono">GPS Mesh Link</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-bold text-emerald-400 font-mono">ONLINE</span>
            </div>
          </div>
          <div className="text-sm font-extrabold text-white font-mono tracking-wide">
            GPS SIGNAL: STABLE
          </div>
          <div className="text-[8px] text-white/40 font-mono">
            Accuracy: <span className="text-white font-bold">5.2 m</span> · Speed: <span className="text-cyan-400 font-bold">{simSpeed} km/h</span>
          </div>
        </div>

        {/* 2. TOP CENTER: CITY REGION OVERLAY */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-black/80 border border-white/15 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.8)] text-center">
            <h2 className="text-xs uppercase tracking-[0.25em] text-white/40 font-mono font-bold leading-none">Delhi</h2>
            <h1 className="text-sm font-black text-white uppercase tracking-widest mt-1">New Delhi</h1>
          </div>
        </div>

        {/* 3. TOP RIGHT: MAP CONTROLS & EXIT */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {/* Tile Layer switcher */}
          <div className="flex bg-black/80 border border-white/10 p-1 rounded-xl gap-1">
            {[
              { id: "dark" as const, name: "Dark" },
              { id: "light" as const, name: "Light" },
              { id: "satellite" as const, name: "Sat" }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setHudStyle(st.id)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                  hudStyle === st.id ? "bg-white/10 text-white font-black" : "text-white/40 hover:text-white/60"
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>

          {/* Compass */}
          <button
            onClick={rotateCompass}
            className="w-9 h-9 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            style={{ transform: `rotate(${mapHeading}deg)` }}
            title="Rotate Map Direction"
          >
            <Compass size={18} className="text-cyan-400" />
          </button>

          {/* Close widescreen */}
          <button
            onClick={() => {
              setIsWidescreenHUD(false);
              setIsAdjustMode(false);
            }}
            className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400 hover:text-white transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* 4. LEFT MIDDLE: ROAD LEGEND OVERLAY */}
        <div className="absolute left-4 top-28 z-20 glass-panel p-4 rounded-xl w-44 border border-white/10 space-y-3">
          <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono font-bold block border-b border-white/5 pb-1.5">
            Road Legend
          </span>
          <div className="space-y-2 text-[9px] font-mono text-white/60">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-1 bg-cyan-400 rounded-full inline-block shadow-[0_0_6px_#06b6d4]" />
                Highway
              </span>
              <span className="text-[8px] text-white/30">Free flow</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-1 bg-emerald-400 rounded-full inline-block shadow-[0_0_6px_#10b981]" />
                Main Road
              </span>
              <span className="text-[8px] text-white/30">Nominal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-1 bg-zinc-600 rounded-full inline-block" />
                Street Road
              </span>
              <span className="text-[8px] text-white/30">Slow</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-1 border-t border-dashed border-cyan-400 inline-block" />
                Route
              </span>
              <span className="text-[8px] text-white/30">Custom</span>
            </div>
          </div>
        </div>

        {/* 5. BOTTOM LEFT: COORDINATES TELEMETRY */}
        <div className="absolute bottom-20 left-4 z-20 glass-panel p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Crosshair size={18} className="animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-white/95">CURRENT LOCATION</span>
              <span className="text-[7px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-400 animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-[8px] text-white/40 mt-0.5">Central Delhi, India</p>
            <p className="text-[8px] font-mono text-cyan-400/90 leading-none mt-1">
              Lat: {currentCoords[0].toFixed(5)}° N · Lng: {currentCoords[1].toFixed(5)}° E
            </p>
          </div>
        </div>

        {/* 6. BOTTOM HUD DASHBOARD BAR */}
        <div className="absolute bottom-4 left-4 right-4 z-20 glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between">
          {/* Edit / Adjustment Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdjustMode(!isAdjustMode)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                isAdjustMode
                  ? "bg-amber-500/20 border-amber-400/40 text-amber-400 animate-pulse"
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white"
              }`}
            >
              Edit Route
            </button>

            {/* Dynamic Route Switching in HUD */}
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-0.5 rounded-lg ml-2">
              {[
                { id: "recommended" as const, name: "Recommended", color: "text-amber-400 border-amber-400/20" },
                { id: "safest" as const, name: "Safest", color: "text-blue-400 border-blue-400/20" },
                { id: "fastest" as const, name: "Fastest", color: "text-emerald-400 border-emerald-400/20" }
              ].map((r) => {
                const active = selectedRoute === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoute(r.id)}
                    className={`px-2.5 py-1 rounded text-[8px] font-bold uppercase transition-all ${
                      active
                        ? "bg-white/10 text-white font-black"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
            
            {isAdjustMode && (
              <span className="text-[9px] text-amber-400 font-mono animate-pulse">
                [CLICK ON MAP TO PLACE / DRAG PIN TO ADJUST]
              </span>
            )}
            
            {waypoint && !isAdjustMode && (
              <span className="text-[8px] font-mono text-white/40">
                Via Checkpoint: <span className="text-amber-400 font-bold">{getWaypointName(waypoint)}</span>
              </span>
            )}
          </div>

          {/* Telemetry Stats */}
          {selectedDest ? (
            <div className="flex items-center gap-8 text-center flex-1 justify-center max-w-xl">
              <div>
                <span className="text-[8px] text-white/30 uppercase tracking-widest font-mono block">Distance Remaining</span>
                <span className="text-lg font-black text-white font-mono mt-0.5 block">{simDistance} km</span>
              </div>
              <div className="h-6 w-px bg-white/5" />
              <div>
                <span className="text-[8px] text-white/30 uppercase tracking-widest font-mono block">Estimated Time</span>
                <span className="text-lg font-black text-white font-mono mt-0.5 block">{simEta} min</span>
              </div>
              <div className="h-6 w-px bg-white/5" />
              <div>
                <span className="text-[8px] text-white/30 uppercase tracking-widest font-mono block">Current Speed</span>
                <span className="text-lg font-black text-cyan-400 font-mono mt-0.5 block">{simSpeed} km/h</span>
              </div>
              <div className="h-6 w-px bg-white/5" />
              <div>
                <span className="text-[8px] text-white/30 uppercase tracking-widest font-mono block">Safety score</span>
                <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">92 / 100</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-white/30 italic">Search and select a destination route to initialize telemetry...</div>
          )}

          {/* Simulation End / Action Trigger */}
          <div className="flex items-center gap-2">
            {selectedDest && (
              <button
                onClick={startJourneySimulation}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white transition-all flex items-center gap-1.5 ${
                  isJourneySimActive
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <Play size={12} className={isJourneySimActive ? "animate-pulse" : ""} />
                {isJourneySimActive ? "Pause Trip" : "Start Trip"}
              </button>
            )}

            <button
              onClick={endJourneySimulation}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              End Trip
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Portrait Mobile Simulator layout (Default tab)
  return (
    <div className="p-4 space-y-4">
      {/* Autocomplete Search Bar */}
      <div className="relative z-30 space-y-2">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-black/40 border border-white/5 shadow-inner">
          <Search size={14} className="text-cyan-400" />
          <input
            type="text"
            placeholder="Search destination, metro, safe zones..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowRecents(searchQuery.length === 0)}
            className="bg-transparent text-xs text-white placeholder-white/30 w-full outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDest(null);
                setSuggestions([]);
                setWaypoint(null);
                setSimProgress(0);
                setIsJourneySimActive(false);
              }}
              className="text-white/40 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Suggestion Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-9 rounded-xl border border-white/10 bg-[#0e0e15] shadow-2xl overflow-hidden text-xs">
            {suggestions.map((place) => (
              <div
                key={place.name}
                onClick={() => selectPlace(place)}
                className="px-3 py-2 hover:bg-white/5 cursor-pointer flex justify-between items-center"
              >
                <span className="text-white/80">{place.name}</span>
                <span className="text-[8px] font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded text-cyan-400">
                  {place.type}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Recent & Saved Locations */}
        {showRecents && (
          <div className="absolute left-0 right-0 top-9 rounded-xl border border-white/10 bg-[#0e0e15] shadow-2xl p-3 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/5">
              <button
                onClick={() => selectPlace(homeLoc)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-left"
              >
                <Compass size={10} className="text-emerald-400" />
                <span className="text-[10px] text-white/80 truncate">Home (CP)</span>
              </button>
              <button
                onClick={() => selectPlace(officeLoc)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-left"
              >
                <Building size={10} className="text-cyan-400" />
                <span className="text-[10px] text-white/80 truncate">Office (Noida)</span>
              </button>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block mb-1">Recent Searches</span>
              {recentSearches.map((term, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const match = OPERATIONAL_PLACES.find(p => p.name.includes(term)) || homeLoc;
                    selectPlace(match);
                  }}
                  className="py-1 hover:text-white text-white/50 cursor-pointer flex items-center gap-1"
                >
                  <Clock size={8} /> <span className="truncate">{term}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map Card */}
      <div className="relative rounded-2xl border border-white/5 bg-black/40 overflow-hidden h-52">
        {trackingActive ? (
          <LiveTrackingMap snapshot={trackingSnapshot} viewMode="civilian" height="208px" showLegend={false} />
        ) : (
          <InteractiveMap
            lat={mapCenterLat}
            lng={mapCenterLng}
            zoom={selectedDest ? 14 : 12}
            markers={mapMarkers}
            routeCoordinates={calculatedRouteCoords}
            lineColor={
              isEmergency
                ? "#ef4444"
                : selectedRoute === "fastest"
                ? "#10b981"
                : selectedRoute === "safest"
                ? "#3b82f6"
                : "#fbbf24"
            }
            routeProgress={simProgress}
            mapStyle="dark"
            isEmergency={isEmergency}
            waypoint={waypoint}
            onMapClick={(lat, lng) => {
              if (isAdjustMode) setWaypoint({ lat, lng });
            }}
            onWaypointDrag={(lat, lng) => {
              setWaypoint({ lat, lng });
            }}
            onMarkerClick={handleMarkerClick}
          />
        )}
        
        {/* Floating Marker detail card for Mobile view */}
        {selectedMarker && (
          <div className="absolute bottom-2 left-2 right-2 z-30 bg-zinc-950/95 backdrop-blur-md p-3 rounded-xl border border-white/10 space-y-2.5 shadow-xl text-white">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[10px] font-bold text-white leading-tight">{selectedMarker.name}</h4>
                <p className="text-[7px] text-cyan-400 mt-0.5 font-mono">INFRASTRUCTURE NODE</p>
              </div>
              <button onClick={() => setSelectedMarker(null)} className="text-white/40 hover:text-white">
                <X size={10} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center text-[8px] font-mono bg-black/40 p-1.5 rounded-lg border border-white/5">
              <div>
                <span className="text-white/35 block uppercase text-[6px]">Distance</span>
                <span className="text-white font-bold">{selectedMarker.distance}</span>
              </div>
              <div>
                <span className="text-white/35 block uppercase text-[6px]">ETA</span>
                <span className="text-white font-bold">{selectedMarker.eta}</span>
              </div>
              <div>
                <span className="text-white/35 block uppercase text-[6px]">Safety</span>
                <span className="text-emerald-400 font-bold">{selectedMarker.safetyScore}%</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  navigateToHaven(selectedMarker.name || selectedMarker.id, selectedMarker.lat, selectedMarker.lng);
                  setSelectedMarker(null);
                }}
                className="flex-1 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-[8px] font-bold text-white uppercase tracking-wider transition-all"
              >
                Navigate
              </button>
              <button
                onClick={() => alert(`Details: Node is active and monitored by Merkle proof ledger. Coordinates: ${selectedMarker.lat}, ${selectedMarker.lng}`)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[8px] font-bold text-white/80 transition-all uppercase"
              >
                Details
              </button>
            </div>
          </div>
        )}
        
        {/* Widescreen Maximizer Trigger */}
        <button
          onClick={() => {
            setIsWidescreenHUD(true);
            setIsAdjustMode(false);
          }}
          className="absolute top-2 right-2 px-2 py-1 rounded bg-black/85 border border-white/10 hover:bg-white/10 hover:text-cyan-400 text-[8px] font-mono font-black text-white/70 tracking-wider z-20 flex items-center gap-1 uppercase transition-all"
        >
          <Sparkles size={8} className="text-cyan-400 animate-pulse" />
          Launch Widescreen HUD
        </button>

        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[8px] font-mono text-white/50 tracking-wider z-20 flex items-center gap-1">
          {trackingActive && <Radio size={8} className="text-emerald-400 animate-pulse" />}
          {trackingActive ? "LIVE RESPONDER GPS" : "GPS SIGNAL: STABLE"}
        </div>
      </div>

      {/* Route Info Overlay Card for Mobile View */}
      {selectedDest && !trackingActive && (
        <div className="rounded-xl border border-white/5 bg-black/85 p-3 space-y-2 text-[10px]">
          <div className="flex justify-between items-center">
            <span className="font-bold text-cyan-400 uppercase tracking-wider text-[8px]">
              Active Route Telemetry
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[7px] font-bold text-emerald-400 font-mono">READY</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1 text-center text-[8px] font-mono bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
            <div>
              <span className="text-white/35 block uppercase text-[6px]">Distance</span>
              <span className="text-white font-bold">{simDistance} km</span>
            </div>
            <div>
              <span className="text-white/35 block uppercase text-[6px]">ETA</span>
              <span className="text-white font-bold">{simEta} min</span>
            </div>
            <div>
              <span className="text-white/35 block uppercase text-[6px]">Speed</span>
              <span className="text-cyan-400 font-bold">{simSpeed} km/h</span>
            </div>
            <div>
              <span className="text-white/35 block uppercase text-[6px]">Safety</span>
              <span className="text-emerald-400 font-bold">{selectedDest.score || 95}%</span>
            </div>
          </div>

          <div className="flex gap-1.5 pt-0.5">
            <button
              onClick={startJourneySimulation}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-1 ${
                isJourneySimActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <Play size={8} className={isJourneySimActive ? "animate-pulse" : ""} />
              {isJourneySimActive ? "Pause Trip" : "Start Trip"}
            </button>
            <button
              onClick={endJourneySimulation}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold uppercase tracking-wider transition-all"
            >
              End
            </button>
          </div>
        </div>
      )}

      {/* Custom Route adjustments in Mobile Frame */}
      {selectedDest && !trackingActive && (
        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 space-y-2 text-[10px]">
          <div className="flex justify-between items-center">
            <span className="font-bold text-cyan-400 uppercase tracking-wider text-[8px]">
              📍 Route Adjustments
            </span>
            <button
              onClick={() => {
                setIsAdjustMode(!isAdjustMode);
                if (!isAdjustMode && !waypoint) {
                  setWaypoint({ lat: (startCoords[0] + selectedDest.lat) / 2, lng: (startCoords[1] + selectedDest.lng) / 2 });
                }
              }}
              className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase transition-all ${
                isAdjustMode ? "bg-amber-500/20 border-amber-400/40 text-amber-400" : "bg-white/5 border-white/10 text-white/50"
              }`}
            >
              {isAdjustMode ? "Click Map to Add" : "Adjust Route"}
            </button>
          </div>
          
          {waypoint && (
            <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-[8px] font-mono text-white/60">
              <span>{getWaypointName(waypoint)}</span>
              <button onClick={() => setWaypoint(null)} className="text-red-400 underline">Clear</button>
            </div>
          )}
        </div>
      )}

      {/* Route Engine Option List */}
      {selectedDest && !trackingActive && (
        <div className="space-y-2">
          <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1">
            <Route size={10} className="text-emerald-400" /> Safe Route Engine Options
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "recommended" as const, name: "Rec.", eta: "18m", score: "94", desc: "Well Lit & Guarded" },
              { id: "safest" as const, name: "Safest", eta: "22m", score: "98", desc: "Max Patrols & Hubs" },
              { id: "fastest" as const, name: "Fastest", eta: "14m", score: "87", desc: "Fewer active nodes" }
            ].map((r) => {
              const active = selectedRoute === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoute(r.id)}
                  className={`rounded-xl p-2 border text-left flex flex-col justify-between h-20 transition-all ${
                    active
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"
                      : "border-white/5 bg-white/[0.01]"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[8px] uppercase tracking-wider font-bold">{r.name}</span>
                    <span className={`text-[10px] font-mono font-bold ${active ? "text-emerald-400" : "text-white/60"}`}>
                      {r.score}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{r.eta}</span>
                    <span className="text-[7px] text-white/30 block mt-0.5 leading-none">{r.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Smart safe Travel Cluster */}
      {selectedDest && !trackingActive && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-3">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <Users size={12} /> Smart safe Travel Cluster
            </span>
            <span className="text-[9px] font-mono bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400 font-bold border border-emerald-500/20">
              {safeTravelClusterCount} Commuters Nearby
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block font-bold">Verified Co-Travellers Nearby:</span>
            {coPassengers.map((p, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCoPassenger(p)}
                className="p-2 rounded-lg bg-black/40 border border-white/5 hover:border-cyan-500/35 cursor-pointer flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                    {p.name[0]}
                  </div>
                  <div>
                    <h5 className="font-semibold text-white/80">{p.name} <span className="text-[8px] bg-emerald-500/10 px-1 py-0.5 rounded text-emerald-400 font-bold ml-1">VERIFIED</span></h5>
                    <p className="text-[8px] text-white/40">Trust Score: {p.trustScore} · {p.direction}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-cyan-400">{p.distance}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Card Overlay Modal */}
      {selectedCoPassenger && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
          <div className="w-64 rounded-2xl border border-white/10 bg-[#0c0c12] p-4 text-center space-y-4 shadow-2xl relative">
            <button onClick={() => setSelectedCoPassenger(null)} className="absolute top-2 right-2 text-white/40 hover:text-white">
              <X size={14} />
            </button>
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-lg font-bold text-cyan-400 mx-auto">
              {selectedCoPassenger.name[0]}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white/95 flex items-center justify-center gap-1">
                {selectedCoPassenger.name} <CheckCircle2 className="text-emerald-400" size={14} />
              </h4>
              <p className="text-[9px] text-white/40 mt-0.5">Trust Score: {selectedCoPassenger.trustScore} / 100</p>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-left text-[9px] font-mono text-white/60 space-y-1">
              <div>Pattern: {selectedCoPassenger.travelPattern}</div>
              <div>Route: {selectedCoPassenger.mutualRoute}</div>
              <div>Status: <span className="text-emerald-400">{selectedCoPassenger.status}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Safezone List */}
      <div className="space-y-2">
        <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1.5">
          <Route size={10} className="text-emerald-400" /> Nearest Safe Havens
        </h3>
        <div className="space-y-2">
          {[
            { name: "Police Station CP Sector 1", type: "police", distance: "450m", lat: 28.631, lng: 77.219 },
            { name: "Fortis Escorts Clinic", type: "hospital", distance: "900m", lat: 28.627, lng: 77.214 },
            { name: "TravelSafe Guard Hub #03", type: "hub", distance: "300m", lat: 28.628, lng: 77.222 }
          ].map((zone) => (
            <div
              key={zone.name}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 bg-black/40 text-cyan-400">
                  {zone.type === "police" ? <Building size={14} /> : <Heart size={14} className="text-pink-400" />}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white/80">{zone.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-white/30">
                    <span><Clock size={8} className="inline mr-0.5" /> 24/7</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-cyan-400 block">{zone.distance}</span>
                <button
                  onClick={() => navigateToHaven(zone.name, zone.lat, zone.lng)}
                  className="text-[8px] px-2 py-0.5 rounded border border-cyan-400/20 bg-cyan-400/10 text-cyan-400 font-medium mt-1 uppercase"
                >
                  Navigate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
