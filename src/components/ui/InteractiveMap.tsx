"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import type { MapMarker } from "@/types";

interface InteractiveMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  markers?: MapMarker[];
  routeCoordinates?: [number, number][]; // Array of [lat, lng]
  lineColor?: string;
  onMapClick?: (lat: number, lng: number) => void;
  onWaypointDrag?: (lat: number, lng: number) => void;
  onMarkerClick?: (markerId: string) => void;
  waypoint?: { lat: number; lng: number } | null;
  routeProgress?: number; // 0 to 1
  mapStyle?: "dark" | "light" | "satellite";
  isEmergency?: boolean;
  secondaryRouteCoordinates?: [number, number][];
  secondaryLineColor?: string;
}

export default function InteractiveMap({
  lat,
  lng,
  zoom = 15,
  markers = [],
  routeCoordinates = [],
  lineColor = "#10b981",
  onMapClick,
  onWaypointDrag,
  onMarkerClick,
  waypoint = null,
  routeProgress = 0,
  mapStyle = "dark",
  isEmergency = false,
  secondaryRouteCoordinates = [],
  secondaryLineColor = "#eab308",
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersGroup = useRef<any>(null);
  const routeLine = useRef<any[]>([]); // Keep array of route layers
  const tileLayerRef = useRef<any>(null);
  const roadLabelsGroup = useRef<any>(null);

  const onMapClickRef = useRef(onMapClick);
  const onWaypointDragRef = useRef(onWaypointDrag);
  const onMarkerClickRef = useRef(onMarkerClick);

  // Progressive route drawing animation state
  const [visiblePointsCount, setVisiblePointsCount] = useState<number>(0);
  const lastDestRef = useRef<string>("");

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onWaypointDragRef.current = onWaypointDrag;
    onMarkerClickRef.current = onMarkerClick;
  }, [onMapClick, onWaypointDrag, onMarkerClick]);

  // Animate route drawing on new destination
  useEffect(() => {
    if (routeCoordinates.length === 0) {
      setVisiblePointsCount(0);
      lastDestRef.current = "";
      return;
    }

    const endPoint = routeCoordinates[routeCoordinates.length - 1];
    const destKey = `${endPoint[0].toFixed(4)},${endPoint[1].toFixed(4)}`;

    if (lastDestRef.current !== destKey) {
      // New destination! Trigger drawing animation
      lastDestRef.current = destKey;
      setVisiblePointsCount(1);
      
      let count = 1;
      const total = routeCoordinates.length;
      const duration = 1000; // 1s drawing animation
      const stepTime = Math.max(10, Math.floor(duration / total));
      
      const interval = setInterval(() => {
        count += Math.max(1, Math.ceil(total / 25)); // Increment smoothly
        if (count >= total) {
          clearInterval(interval);
          setVisiblePointsCount(total);
        } else {
          setVisiblePointsCount(count);
        }
      }, stepTime);

      return () => clearInterval(interval);
    } else {
      // Waypoint dragging: update instantly
      setVisiblePointsCount(routeCoordinates.length);
    }
  }, [routeCoordinates]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // 1. Load Leaflet CSS
    if (!document.getElementById("leaflet-css-cdn")) {
      const link = document.createElement("link");
      link.id = "leaflet-css-cdn";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      // 2. Initialize map instance
      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([lat, lng], zoom);

        // Add zoom controls in bottom-right
        L.control.zoom({ position: "bottomright" }).addTo(leafletMap.current);

        // Layer group for markers
        markersGroup.current = L.layerGroup().addTo(leafletMap.current);
        roadLabelsGroup.current = L.layerGroup().addTo(leafletMap.current);

        // Handle Map click to drop safety check-in node
        leafletMap.current.on("click", (e: any) => {
          if (onMapClickRef.current) {
            onMapClickRef.current(e.latlng.lat, e.latlng.lng);
          }
        });
      } else {
        // Update view
        leafletMap.current.setView([lat, lng], zoom);
      }

      const map = leafletMap.current;

      // 2.1 Update Tile Layer Style dynamically
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      let tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"; // Dark Matter
      if (mapStyle === "light") {
        tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"; // Light Voyager
      } else if (mapStyle === "satellite") {
        tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      }

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 20,
      }).addTo(map);

      // 3. Render Markers
      if (markersGroup.current) {
        markersGroup.current.clearLayers();

        markers.forEach((marker) => {
          // Custom glowing html marker icons
          const colorClass =
            marker.type === "victim"
              ? "bg-red-500 shadow-[0_0_12px_#ef4444]"
              : marker.type === "guardian"
                ? "bg-cyan-400 shadow-[0_0_12px_#22d3ee]"
                : marker.type === "police"
                  ? "bg-purple-500 shadow-[0_0_12px_#a855f7]"
                  : "bg-emerald-400 shadow-[0_0_12px_#34d399]";

          const customIcon = L.divIcon({
            className: "custom-map-icon",
            html: `<div class="w-3.5 h-3.5 rounded-full border-2 border-white ${colorClass} transition-all duration-500"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          const m = L.marker([marker.lat, marker.lng], { icon: customIcon })
            .bindPopup(`<span class="text-[10px] font-mono text-zinc-900">${marker.label}</span>`)
            .addTo(markersGroup.current);

          m.on("click", () => {
            if (onMarkerClickRef.current) {
              onMarkerClickRef.current(marker.id);
            }
          });

          if (marker.type === "victim") {
            m.openPopup();
          }
        });

        // Draw custom draggable Route Waypoint
        if (waypoint) {
          const waypointIcon = L.divIcon({
            className: "custom-map-icon",
            html: `<div class="relative flex items-center justify-center">
              <div class="absolute w-6.5 h-6.5 rounded-full border border-amber-400/40 animate-ping"></div>
              <div class="w-4.5 h-4.5 rounded-full border-2 border-white bg-amber-500 shadow-[0_0_14px_#f59e0b] flex items-center justify-center text-[10px] text-zinc-950 font-extrabold animate-pulse">📍</div>
            </div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });

          const m = L.marker([waypoint.lat, waypoint.lng], { icon: waypointIcon, draggable: true })
            .bindPopup(`<span class="text-[9px] font-mono text-zinc-900"><b>Custom Route Waypoint</b><br/>Drag point to adjust</span>`)
            .addTo(markersGroup.current);

          m.on("drag", (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            if (onWaypointDragRef.current) {
              onWaypointDragRef.current(lat, lng);
            }
          });
        }
      }

      // 3.1 Render Road Labels (glowing overlays)
      if (roadLabelsGroup.current) {
        roadLabelsGroup.current.clearLayers();
        const roadLabels = [
          { name: "NH 44", lat: 28.6180, lng: 77.2130 },
          { name: "Ring Road", lat: 28.6320, lng: 77.1950 },
          { name: "GT Karnal Rd", lat: 28.6520, lng: 77.2110 },
          { name: "Noida Link Rd", lat: 28.6190, lng: 77.2750 },
          { name: "DND Flyway", lat: 28.5850, lng: 77.2650 },
          { name: "Mathura Rd", lat: 28.5720, lng: 77.2450 },
          { name: "Lodhi Road", lat: 28.5920, lng: 77.2250 },
          { name: "Pusa Rd", lat: 28.6390, lng: 77.1850 },
          { name: "Shankar Rd", lat: 28.6320, lng: 77.1810 },
          { name: "Mahatma Gandhi Rd", lat: 28.6010, lng: 77.2610 }
        ];

        roadLabels.forEach((lbl) => {
          const divIcon = L.divIcon({
            className: "glowing-road-label",
            html: `<div class="glowing-road-label-inner">${lbl.name}</div>`,
            iconSize: [60, 16],
            iconAnchor: [30, 8]
          });
          L.marker([lbl.lat, lbl.lng], { icon: divIcon, interactive: false }).addTo(roadLabelsGroup.current);
        });
      }

      // 4. Render Route Path (Neon double-line glow + progress split)
      if (routeLine.current) {
        routeLine.current.forEach((layer) => map.removeLayer(layer));
        routeLine.current = [];
      }

      if (routeCoordinates && routeCoordinates.length > 0) {
        const animatedCoords = routeCoordinates.slice(0, visiblePointsCount);
        if (animatedCoords.length >= 2) {
          const isEmergencyRoute = lineColor === "#ef4444" || isEmergency;
          const isGuardian = lineColor === "#eab308" || lineColor === "#fbbf24";
          
          let lineClass = "";
          if (isEmergencyRoute) lineClass = "emergency-pulse-route";
          else if (isGuardian) lineClass = "guardian-moving-dash-route";

          const progressIndex = Math.floor(routeProgress * (animatedCoords.length - 1));

          if (progressIndex > 0 && !isEmergencyRoute) {
            // Completed segment (Dark Green / Gray)
            const completedCoords = animatedCoords.slice(0, progressIndex + 1);
            
            const compGlow = L.polyline(completedCoords, {
              color: "#022c22",
              weight: 12,
              opacity: 0.2,
              lineJoin: "round"
            }).addTo(map);

            const compCore = L.polyline(completedCoords, {
              color: "#064e3b",
              weight: 6,
              opacity: 0.8,
              lineJoin: "round"
            }).addTo(map);

            routeLine.current.push(compGlow, compCore);

            // Remaining segment (Neon green / blue / yellow)
            const remainingCoords = animatedCoords.slice(progressIndex);

            const remGlow = L.polyline(remainingCoords, {
              color: lineColor,
              weight: 12,
              opacity: 0.25,
              lineJoin: "round"
            }).addTo(map);

            const remCore = L.polyline(remainingCoords, {
              color: lineColor,
              weight: 6,
              opacity: 0.95,
              className: lineClass,
              lineJoin: "round"
            }).addTo(map);

            routeLine.current.push(remGlow, remCore);
          } else {
            // Single unsplit route segment (double-line glow effect)
            const glowLine = L.polyline(animatedCoords, {
              color: lineColor,
              weight: 12,
              opacity: 0.25,
              lineJoin: "round"
            }).addTo(map);

            const coreLine = L.polyline(animatedCoords, {
              color: lineColor,
              weight: 6,
              opacity: 0.95,
              className: lineClass,
              lineJoin: "round"
            }).addTo(map);

            routeLine.current.push(glowLine, coreLine);
          }
        }
      }

      // Draw secondary route if provided (e.g. for dual trails in XyroShield)
      if (secondaryRouteCoordinates && secondaryRouteCoordinates.length >= 2) {
        const secGlow = L.polyline(secondaryRouteCoordinates, {
          color: secondaryLineColor || "#eab308",
          weight: 10,
          opacity: 0.2,
          lineJoin: "round"
        }).addTo(map);

        const secCore = L.polyline(secondaryRouteCoordinates, {
          color: secondaryLineColor || "#eab308",
          weight: 5,
          opacity: 0.9,
          className: "guardian-moving-dash-route",
          lineJoin: "round"
        }).addTo(map);

        routeLine.current.push(secGlow, secCore);
      }
    };

    // 5. Load Leaflet script dynamically
    if (!(window as any).L) {
      if (!document.getElementById("leaflet-js-script")) {
        const script = document.createElement("script");
        script.id = "leaflet-js-script";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = initMap;
        document.body.appendChild(script);
      }
    } else {
      initMap();
    }
  }, [lat, lng, zoom, markers, routeCoordinates, visiblePointsCount, lineColor, mapStyle, isEmergency, routeProgress, waypoint, secondaryLineColor, secondaryRouteCoordinates]);

  useEffect(() => {
    if (leafletMap.current && routeCoordinates && routeCoordinates.length >= 2) {
      const L = (window as any).L;
      if (L) {
        const bounds = L.latLngBounds(routeCoordinates);
        leafletMap.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [routeCoordinates]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-white/5 bg-zinc-950">
      <div ref={mapRef} className="w-full h-full z-10" />
      {/* Decorative HUD scanning overlay */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-xl z-20 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]" />
    </div>
  );
}
