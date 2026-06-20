"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useCallback } from "react";
import type { LiveResponder, MapPointOfInterest, TrackingSnapshot } from "@/types";
import { TRACKING_UPDATE_INTERVAL_MS } from "@/lib/tracking";

export type MapViewMode = "civilian" | "guardian" | "police" | "command";

interface LiveTrackingMapProps {
  snapshot: TrackingSnapshot | null;
  viewMode?: MapViewMode;
  height?: string;
  showLegend?: boolean;
  showProgress?: boolean;
}

interface AnimatedMarker {
  marker: any;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  animStart: number;
  animDuration: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function LiveTrackingMap({
  snapshot,
  viewMode = "command",
  height = "100%",
  showLegend = true,
  showProgress = true,
}: LiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const layerGroups = useRef<Record<string, any>>({});
  const animatedMarkers = useRef<Map<string, AnimatedMarker>>(new Map());
  const markersMap = useRef<Map<string, any>>(new Map());
  const animFrameRef = useRef<number>(0);

  const animateMarkers = useCallback(() => {
    const now = performance.now();
    animatedMarkers.current.forEach((entry) => {
      const elapsed = now - entry.animStart;
      const rawT = Math.min(1, elapsed / entry.animDuration);
      const t = easeOutCubic(rawT);
      const lat = lerp(entry.fromLat, entry.toLat, t);
      const lng = lerp(entry.fromLng, entry.toLng, t);
      entry.marker.setLatLng([lat, lng]);
    });
    animFrameRef.current = requestAnimationFrame(animateMarkers);
  }, []);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animateMarkers);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [animateMarkers]);

  useEffect(() => {
    return () => {
      markersMap.current.clear();
      animatedMarkers.current.clear();
    };
  }, []);

  const moveMarker = useCallback((id: string, lat: number, lng: number, marker: any) => {
    const existing = animatedMarkers.current.get(id);
    if (existing) {
      existing.fromLat = existing.marker.getLatLng().lat;
      existing.fromLng = existing.marker.getLatLng().lng;
      existing.toLat = lat;
      existing.toLng = lng;
      existing.animStart = performance.now();
    } else {
      animatedMarkers.current.set(id, {
        marker,
        fromLat: lat,
        fromLng: lng,
        toLat: lat,
        toLng: lng,
        animStart: performance.now(),
        animDuration: TRACKING_UPDATE_INTERVAL_MS,
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    if (!document.getElementById("leaflet-css-cdn")) {
      const link = document.createElement("link");
      link.id = "leaflet-css-cdn";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const render = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([28.6145, 77.211], 14);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 20,
          subdomains: "abcd",
        }).addTo(leafletMap.current);

        L.control.zoom({ position: "bottomright" }).addTo(leafletMap.current);

        ["routes", "zones", "poi", "markers"].forEach((key) => {
          layerGroups.current[key] = L.layerGroup().addTo(leafletMap.current);
        });
      }

      const map = leafletMap.current;
      const groups = layerGroups.current;

      // Clear layout elements (except persistent markers, which we manage item-by-item)
      groups.routes.clearLayers();
      groups.zones.clearLayers();
      groups.poi.clearLayers();

      const incident = snapshot?.incident;
      if (!incident) {
        map.setView([28.6145, 77.211], 13);
        groups.markers.clearLayers();
        markersMap.current.clear();
        animatedMarkers.current.clear();
        return;
      }

      const { victim, incidentZone, responders, hospitals, policeStations, safeZones } = incident;

      // 1. Draw Incident Zone (red)
      L.circle([incidentZone.lat, incidentZone.lng], {
        radius: incidentZone.radiusM,
        color: "#ef4444",
        weight: 2,
        fillColor: "#ef4444",
        fillOpacity: 0.12,
        dashArray: "6, 4",
      })
        .bindPopup(`<span class="text-[9px] font-mono">🔴 Incident Zone</span>`)
        .addTo(groups.zones);

      // 2. Draw Safe Zones, Hospitals, & Police Stations (POIs)
      if (viewMode === "command" || viewMode === "police") {
        safeZones?.forEach((sz: MapPointOfInterest) => {
          L.circle([sz.lat, sz.lng], {
            radius: 100,
            color: "#10b981",
            weight: 1,
            fillColor: "#10b981",
            fillOpacity: 0.1,
          }).addTo(groups.zones);

          const icon = L.divIcon({
            className: "custom-map-icon",
            html: `<div class="w-4 h-4 rounded-full border border-white bg-emerald-500 shadow-[0_0_10px_#10b981] flex items-center justify-center text-[7px] text-white font-bold">🛡</div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker([sz.lat, sz.lng], { icon })
            .bindPopup(`<span class="text-[9px] font-mono">🛡 ${sz.name}</span>`)
            .addTo(groups.poi);
        });

        hospitals?.forEach((h: MapPointOfInterest) => {
          const icon = L.divIcon({
            className: "custom-map-icon",
            html: `<div class="w-4 h-4 rounded-full border border-white bg-pink-500 shadow-[0_0_10px_#ec4899] flex items-center justify-center text-[7px] text-white font-bold">🏥</div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker([h.lat, h.lng], { icon })
            .bindPopup(`<span class="text-[9px] font-mono">🏥 ${h.name}</span>`)
            .addTo(groups.poi);
        });

        policeStations?.forEach((ps: MapPointOfInterest) => {
          const icon = L.divIcon({
            className: "custom-map-icon",
            html: `<div class="w-4 h-4 rounded-full border border-white bg-indigo-500 shadow-[0_0_10px_#6366f1] flex items-center justify-center text-[7px] text-white font-bold">👮</div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker([ps.lat, ps.lng], { icon })
            .bindPopup(`<span class="text-[9px] font-mono">👮 ${ps.name}</span>`)
            .addTo(groups.poi);
        });
      }

      // 3. Draw Victim Route (if available) - Animated Green dashed line
      const victimRouteCoords = incident.victimRoute || snapshot?.victimRoute;
      if (victimRouteCoords && victimRouteCoords.length > 0) {
        const routeCoords = victimRouteCoords.map((p: any) => [p.lat, p.lng]);
        L.polyline(routeCoords, {
          color: "#10b981",
          weight: 4,
          opacity: 0.85,
          dashArray: "6, 6",
          className: "animated-route-line",
          lineJoin: "round",
        }).addTo(groups.routes);
      }

      // 4. Set up set of active marker IDs to avoid clearing and snapping
      const activeMarkerIds = new Set<string>();

      // Render Victim Marker
      const victimId = "victim";
      activeMarkerIds.add(victimId);
      const victimIconHtml = `<div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full border border-emerald-400/40 animate-ping"></div>
        <div class="w-5 h-5 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_14px_#10b981] flex items-center justify-center text-[8px] text-white font-extrabold">V</div>
      </div>`;
      const victimPopupText = `<span class="text-[9px] font-mono">🟢 <b>${victim.name}</b><br/>Victim Location</span>`;

      let victimM = markersMap.current.get(victimId);
      if (victimM) {
        victimM.setPopupContent(victimPopupText);
        moveMarker(victimId, victim.lat, victim.lng, victimM);
      } else {
        const victimIcon = L.divIcon({
          className: "custom-map-icon",
          html: victimIconHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        victimM = L.marker([victim.lat, victim.lng], { icon: victimIcon })
          .bindPopup(victimPopupText)
          .addTo(groups.markers);
        markersMap.current.set(victimId, victimM);
        moveMarker(victimId, victim.lat, victim.lng, victimM);
      }

      // Render Responders (and their routes)
      responders?.forEach((responder: LiveResponder) => {
        activeMarkerIds.add(responder.id);

        const routeColor = responder.type === "guardian" ? "#eab308" : "#3b82f6";
        const routeCoords = responder.route.map((p) => [p.lat, p.lng]);
        const progressIdx = Math.max(0, Math.min(routeCoords.length - 1, Math.floor(responder.routeProgress * (routeCoords.length - 1))));

        // Full route - Animated dashed line
        L.polyline(routeCoords, {
          color: routeColor,
          weight: 3,
          opacity: 0.35,
          dashArray: "6, 6",
          className: "animated-route-line",
          lineJoin: "round",
        }).addTo(groups.routes);

        // Traveled portion (bright solid line)
        if (progressIdx > 0) {
          L.polyline(routeCoords.slice(0, progressIdx + 1), {
            color: routeColor,
            weight: 5,
            opacity: 0.95,
            lineJoin: "round",
          }).addTo(groups.routes);
        }

        const isGuardian = responder.type === "guardian";
        const responderIconHtml = isGuardian
          ? `<div class="relative flex items-center justify-center">
              <div class="absolute w-7 h-7 rounded-full border border-yellow-400/30 animate-pulse"></div>
              <div class="w-5 h-5 rounded-full border-2 border-white bg-yellow-500 shadow-[0_0_14px_#eab308] flex items-center justify-center text-[7px] text-zinc-900 font-extrabold">G</div>
            </div>`
          : `<div class="relative flex items-center justify-center">
              <div class="absolute w-7 h-7 rounded-full border border-blue-400/30 animate-pulse"></div>
              <div class="w-5 h-5 rounded-full border-2 border-white bg-blue-600 shadow-[0_0_14px_#3b82f6] flex items-center justify-center text-[7px] text-white font-extrabold">🚔</div>
            </div>`;

        const responderPopupText = isGuardian
          ? `<span class="text-[9px] font-mono">🟡 <b>${responder.name}</b><br/>Status: Responding<br/>Distance: ${responder.distanceKm.toFixed(1)} KM<br/>ETA: ${responder.etaMinutes} min</span>`
          : `<span class="text-[9px] font-mono">🚔 <b>${responder.name}</b><br/>Officer: ${responder.officer}<br/>Status: En Route<br/>Distance: ${responder.distanceKm.toFixed(1)} KM<br/>ETA: ${responder.etaMinutes} min</span>`;

        let responderM = markersMap.current.get(responder.id);
        if (responderM) {
          responderM.setPopupContent(responderPopupText);
          moveMarker(responder.id, responder.lat, responder.lng, responderM);
        } else {
          const icon = L.divIcon({
            className: "custom-map-icon",
            html: responderIconHtml,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          responderM = L.marker([responder.lat, responder.lng], { icon })
            .bindPopup(responderPopupText)
            .addTo(groups.markers);
          markersMap.current.set(responder.id, responderM);
          moveMarker(responder.id, responder.lat, responder.lng, responderM);
        }
      });

      // Remove any markers that are no longer active
      markersMap.current.forEach((marker, id) => {
        if (!activeMarkerIds.has(id)) {
          groups.markers.removeLayer(marker);
          markersMap.current.delete(id);
          animatedMarkers.current.delete(id);
        }
      });

      // Fit bounds to keep victim and responders in view
      if (responders.length > 0) {
        const allPoints = [
          [victim.lat, victim.lng],
          ...responders.map((r) => [r.lat, r.lng]),
        ];
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } else {
        map.setView([victim.lat, victim.lng], 15);
      }
    };

    if (!(window as any).L) {
      if (!document.getElementById("leaflet-js-script")) {
        const script = document.createElement("script");
        script.id = "leaflet-js-script";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = render;
        document.body.appendChild(script);
      }
    } else {
      render();
    }
  }, [snapshot, viewMode, moveMarker]);

  const incident = snapshot?.incident;
  const responders = incident?.responders || [];

  return (
    <div className="w-full relative rounded-xl overflow-hidden border border-white/5 bg-zinc-950" style={{ height }}>
      <div ref={mapRef} className="w-full h-full z-10" />

      {/* Live GPS HUD */}
      <div className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-xl bg-black/85 border border-white/10 backdrop-blur-md space-y-0.5 text-[8px] font-mono text-white/50">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${snapshot?.phase !== "idle" && snapshot?.phase !== "RESOLVED" ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
          <span>LIVE GPS · WebSocket</span>
        </div>
        <div>UPDATE: every 5s · {responders.length} responders</div>
      </div>

      {/* Route progress overlay */}
      {showProgress && responders.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-1.5 max-w-[200px]">
          {responders.map((r) => (
            <div
              key={r.id}
              className="px-2.5 py-1.5 rounded-lg bg-black/85 border border-white/10 backdrop-blur-md text-[8px] font-mono"
            >
              <div className="flex justify-between text-white/60 mb-1">
                <span className={r.type === "guardian" ? "text-yellow-400" : "text-blue-400"}>
                  {r.type === "guardian" ? "🟡" : "🚔"} {r.name.split(" ")[0]}
                </span>
                <span className="text-cyan-400">{Math.round(r.routeProgress * 100)}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${r.type === "guardian" ? "bg-yellow-500" : "bg-blue-500"}`}
                  style={{ width: `${Math.round(r.routeProgress * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="absolute top-3 right-3 z-20 px-2.5 py-2 rounded-xl bg-black/85 border border-white/10 backdrop-blur-md text-[7px] font-mono text-white/50 space-y-1">
          <div><span className="text-emerald-400">🟢</span> Victim</div>
          <div><span className="text-yellow-400">🟡</span> Guardian</div>
          <div><span className="text-blue-400">🔵</span> Police</div>
          <div><span className="text-red-400">🔴</span> Incident Zone</div>
          {viewMode === "command" && (
            <>
              <div><span className="text-pink-400">🏥</span> Hospitals</div>
              <div><span className="text-indigo-400">👮</span> Police Stations</div>
              <div><span className="text-emerald-400">🛡</span> Safe Zones</div>
            </>
          )}
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-xl z-15 shadow-[inset_0_0_40px_rgba(0,0,0,0.85)]" />
    </div>
  );
}
