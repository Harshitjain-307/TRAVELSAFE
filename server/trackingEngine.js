const { GeoStore } = require("./geoStore");

const UPDATE_INTERVAL_MS = 5000;
const ARRIVAL_THRESHOLD_M = 80;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1, lng1, lat2, lng2) {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function etaMinutes(distanceKm, speedKmh) {
  if (distanceKm <= 0.05) return 0;
  return Math.max(1, Math.ceil((distanceKm / speedKmh) * 60));
}

function interpolateRoute(waypoints, progress) {
  if (waypoints.length < 2) return waypoints[0] || { lat: 0, lng: 0 };
  const clamped = Math.min(1, Math.max(0, progress));
  const totalSegments = waypoints.length - 1;
  const scaled = clamped * totalSegments;
  const segIndex = Math.min(Math.floor(scaled), totalSegments - 1);
  const segProgress = scaled - segIndex;
  const a = waypoints[segIndex];
  const b = waypoints[segIndex + 1];
  return {
    lat: a.lat + (b.lat - a.lat) * segProgress,
    lng: a.lng + (b.lng - a.lng) * segProgress,
  };
}

function buildRouteWaypoints(start, end, viaPoints = []) {
  const points = [start, ...viaPoints, end];
  const waypoints = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    
    // Perpendicular grid segments (Street-aligned turns)
    const turnPoint = { lat: b.lat, lng: a.lng };
    const segments = [
      { start: a, end: turnPoint },
      { start: turnPoint, end: b }
    ];

    segments.forEach((seg) => {
      const steps = 4;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        waypoints.push({
          lat: seg.start.lat + (seg.end.lat - seg.start.lat) * t,
          lng: seg.start.lng + (seg.end.lng - seg.start.lng) * t,
        });
      }
    });
  }
  waypoints.push(end);
  return waypoints;
}

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || "";

async function fetchMapboxRoute(start, end, viaPoints = []) {
  if (!MAPBOX_TOKEN) {
    console.log("> Mapbox Access Token not found. Falling back to local route generator.");
    return null;
  }
  const points = [start, ...viaPoints, end];
  const coordsStr = points.map(p => `${p.lng},${p.lat}`).join(";");
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsStr}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Mapbox Directions API failed: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    if (data.routes && data.routes[0] && data.routes[0].geometry) {
      const coordinates = data.routes[0].geometry.coordinates;
      console.log(`> Successfully fetched route from Mapbox Directions API: ${coordinates.length} points.`);
      return coordinates.map(([lng, lat]) => ({ lat, lng }));
    }
  } catch (err) {
    console.error("Failed to fetch Mapbox route:", err);
  }
  return null;
}

async function getRouteWaypoints(start, end, viaPoints = []) {
  const mapboxRoute = await fetchMapboxRoute(start, end, viaPoints);
  if (mapboxRoute && mapboxRoute.length >= 2) {
    return mapboxRoute;
  }
  return buildRouteWaypoints(start, end, viaPoints);
}

const INCIDENT_DEFAULTS = {
  id: "INC-2026-CP07",
  victim: {
    id: "victim-1",
    name: "Priya Sharma",
    lat: 28.6145,
    lng: 77.211,
  },
  victimRoute: [
    { lat: 28.6100, lng: 77.205 },
    { lat: 28.6115, lng: 77.207 },
    { lat: 28.6130, lng: 77.209 },
    { lat: 28.6145, lng: 77.211 },
  ],
  incidentZone: { lat: 28.6145, lng: 77.211, radiusM: 200 },
  hospitals: [
    { id: "h1", name: "Fortis Escorts", lat: 28.627, lng: 77.214 },
    { id: "h2", name: "AIIMS Trauma Center", lat: 28.608, lng: 77.205 },
  ],
  policeStations: [
    { id: "ps1", name: "CP Police Station", lat: 28.631, lng: 77.219 },
    { id: "ps2", name: "Parliament Street PS", lat: 28.622, lng: 77.208 },
  ],
  safeZones: [
    { id: "sz1", name: "Guard Hub #03", lat: 28.612, lng: 77.206 },
    { id: "sz2", name: "Metro Safe Point", lat: 28.617, lng: 77.213 },
  ],
};

const GUARDIAN_POOL = [
  {
    id: "g-rahul",
    name: "Rahul Singh",
    startLat: 28.6253, // Exactly 1.2 KM away
    startLng: 77.211,
    via: [{ lat: 28.6200, lng: 77.211 }],
    speedKmh: 18, // 18 km/h walking/slow vehicle -> 1.2 KM takes exactly 4 mins
    color: "#eab308",
  },
  {
    id: "g-amit",
    name: "Amit Trivedi",
    startLat: 28.6280, // Exactly 1.5 KM away
    startLng: 77.211,
    via: [{ lat: 28.6210, lng: 77.211 }],
    speedKmh: 18, // 1.5 KM takes exactly 5 mins
    color: "#f59e0b",
  },
  {
    id: "g-sneha",
    name: "Sneha Goel",
    startLat: 28.6334, // Exactly 2.1 KM away
    startLng: 77.211,
    via: [{ lat: 28.6240, lng: 77.211 }],
    speedKmh: 18, // 2.1 KM takes exactly 7 mins
    color: "#fbbf24",
  },
];

const POLICE_UNITS = [
  {
    id: "p-14",
    name: "Police Unit P-14",
    officer: "Inspector Sharma",
    startLat: 28.6370, // Exactly 2.5 KM away
    startLng: 77.211,
    via: [{ lat: 28.6260, lng: 77.211 }],
    speedKmh: 50, // 50 km/h driving -> 2.5 KM takes exactly 3 mins
    color: "#3b82f6",
  },
];

class TrackingEngine {
  constructor(io) {
    this.io = io;
    this.store = new GeoStore();
    this.incident = null;
    this.tickInterval = null;
    this.demoTimeouts = [];
    this.phase = "idle";
  }

  getSnapshot() {
    if (!this.incident) return { phase: "idle", incident: null };
    return {
      phase: this.phase,
      incident: this.incident,
      responders: this.incident.responders,
      victim: this.incident.victim,
      victimRoute: this.incident.victimRoute,
      incidentZone: this.incident.incidentZone,
      hospitals: this.incident.hospitals,
      policeStations: this.incident.policeStations,
      safeZones: this.incident.safeZones,
    };
  }

  broadcast(event, data) {
    this.io.emit(event, data);
    if (this.incident) {
      this.io.to(this.incident.id).emit(event, data);
    }
  }

  broadcastSnapshot() {
    this.broadcast("incident:state", this.getSnapshot());
  }

  createIncident() {
    const dest = { lat: INCIDENT_DEFAULTS.victim.lat, lng: INCIDENT_DEFAULTS.victim.lng };
    const responders = [];

    this.incident = {
      ...INCIDENT_DEFAULTS,
      status: "ACTIVE",
      phase: "EMERGENCY_TRIGGERED",
      responders,
      startedAt: new Date().toISOString(),
    };

    this.store.createIncident(this.incident);
    this.phase = "EMERGENCY_TRIGGERED";
    this.broadcastSnapshot();
    return this.incident;
  }

  async acceptGuardian(guardianId, customName) {
    if (!this.incident) this.createIncident();

    const template = GUARDIAN_POOL.find((g) => g.id === guardianId) || GUARDIAN_POOL[0];
    const dest = { lat: this.incident.victim.lat, lng: this.incident.victim.lng };
    const start = { lat: template.startLat, lng: template.startLng };
    const route = await getRouteWaypoints(start, dest, template.via);
    const totalDist = haversineKm(start.lat, start.lng, dest.lat, dest.lng);

    const responder = {
      id: template.id,
      type: "guardian",
      name: customName || template.name,
      officer: null,
      status: "responding",
      lat: start.lat,
      lng: start.lng,
      speed: template.speedKmh,
      direction: bearing(start.lat, start.lng, dest.lat, dest.lng),
      route,
      routeProgress: 0,
      distanceKm: totalDist,
      etaMinutes: etaMinutes(totalDist, template.speedKmh),
      color: template.color,
      totalRouteKm: totalDist,
    };

    const existing = this.incident.responders.findIndex((r) => r.id === responder.id);
    if (existing >= 0) {
      this.incident.responders[existing] = responder;
    } else {
      this.incident.responders.push(responder);
    }

    this.phase = "GUARDIAN_EN_ROUTE";
    this.incident.phase = this.phase;
    this.store.updateIncident(this.incident.id, this.incident);
    this.broadcast("responder:accepted", { responder });
    this.broadcastSnapshot();
    this.ensureTicking();
    return responder;
  }

  async dispatchPolice(unitId) {
    if (!this.incident) this.createIncident();

    const template = POLICE_UNITS.find((p) => p.id === unitId) || POLICE_UNITS[0];
    const dest = { lat: this.incident.victim.lat, lng: this.incident.victim.lng };
    const start = { lat: template.startLat, lng: template.startLng };
    const route = await getRouteWaypoints(start, dest, template.via);
    const totalDist = haversineKm(start.lat, start.lng, dest.lat, dest.lng);

    const responder = {
      id: template.id,
      type: "police",
      name: template.name,
      officer: template.officer,
      status: "en_route",
      lat: start.lat,
      lng: start.lng,
      speed: template.speedKmh,
      direction: bearing(start.lat, start.lng, dest.lat, dest.lng),
      route,
      routeProgress: 0,
      distanceKm: totalDist,
      etaMinutes: etaMinutes(totalDist, template.speedKmh),
      color: template.color,
      totalRouteKm: totalDist,
    };

    const existing = this.incident.responders.findIndex((r) => r.id === responder.id);
    if (existing >= 0) {
      this.incident.responders[existing] = responder;
    } else {
      this.incident.responders.push(responder);
    }

    this.phase = "POLICE_EN_ROUTE";
    this.incident.phase = this.phase;
    this.store.updateIncident(this.incident.id, this.incident);
    this.broadcast("police:dispatched", { responder });
    this.broadcastSnapshot();
    this.ensureTicking();
    return responder;
  }

  ensureTicking() {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => this.tick(), UPDATE_INTERVAL_MS);
  }

  stopTicking() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  tick() {
    if (!this.incident || this.incident.responders.length === 0) return;

    const dest = { lat: this.incident.victim.lat, lng: this.incident.victim.lng };
    let allArrived = true;

    this.incident.responders.forEach((responder) => {
      if (responder.status === "arrived") return;

      const progressIncrement =
        (responder.speed / 3600) * (UPDATE_INTERVAL_MS / 1000) / responder.totalRouteKm;
      responder.routeProgress = Math.min(1, responder.routeProgress + progressIncrement);

      const pos = interpolateRoute(responder.route, responder.routeProgress);
      const prevLat = responder.lat;
      const prevLng = responder.lng;

      responder.lat = pos.lat;
      responder.lng = pos.lng;
      responder.direction = bearing(prevLat, prevLng, pos.lat, pos.lng);
      responder.distanceKm = haversineKm(pos.lat, pos.lng, dest.lat, dest.lng);
      responder.etaMinutes = etaMinutes(responder.distanceKm, responder.speed);

      // MongoDB GeoJSON format logs stored in GeoStore
      this.store.appendTelemetry(this.incident.id, {
        responderId: responder.id,
        type: responder.type,
        lat: responder.lat,
        lng: responder.lng,
        speed: responder.speed,
        direction: responder.direction,
        eta: responder.etaMinutes,
        routeProgress: Math.round(responder.routeProgress * 100),
      });

      if (responder.distanceKm * 1000 <= ARRIVAL_THRESHOLD_M || responder.routeProgress >= 1) {
        if (responder.status !== "arrived") {
          responder.status = "arrived";
          responder.etaMinutes = 0;
          responder.distanceKm = 0;
          responder.routeProgress = 1;
          responder.lat = dest.lat;
          responder.lng = dest.lng;

          // Arrival detection triggers notification broadcast
          this.broadcast("responder:arrived", {
            responderId: responder.id,
            type: responder.type,
            name: responder.name,
            message:
              responder.type === "guardian"
                ? `${responder.name} Arrived On Scene — ETA Complete. Response Started.`
                : `${responder.name} (${responder.officer}) Arrived On Scene — ETA Complete. Response Started.`,
          });
        }
      } else {
        allArrived = false;
      }

      this.broadcast("responder:update", {
        responderId: responder.id,
        lat: responder.lat,
        lng: responder.lng,
        speed: responder.speed,
        direction: responder.direction,
        distanceKm: responder.distanceKm,
        etaMinutes: responder.etaMinutes,
        routeProgress: Math.round(responder.routeProgress * 100),
        status: responder.status,
      });
    });

    if (allArrived && this.incident.responders.every((r) => r.status === "arrived")) {
      this.phase = "RESOLVED";
      this.incident.phase = "RESOLVED";
      this.incident.status = "RESOLVED";
      this.broadcast("incident:resolved", {
        message: "All responders on scene. Incident resolved.",
      });
      this.broadcastSnapshot();
      this.stopTicking();
    }
  }

  startDemo() {
    this.reset();
    this.createIncident();

    this.scheduleDemo(() => {
      this.phase = "SOS_BROADCAST";
      this.incident.phase = "SOS_BROADCAST";
      this.broadcastSnapshot();
    }, 1000);

    this.scheduleDemo(async () => {
      await this.acceptGuardian("g-rahul", "Rahul Singh");
    }, 2500);

    this.scheduleDemo(async () => {
      await this.acceptGuardian("g-amit", "Amit Trivedi");
    }, 3500);

    this.scheduleDemo(async () => {
      await this.acceptGuardian("g-sneha", "Sneha Goel");
    }, 4200);

    this.scheduleDemo(async () => {
      await this.dispatchPolice("p-14");
    }, 5000);

    this.scheduleDemo(() => {
      this.phase = "TRACKING_LIVE";
      this.incident.phase = "TRACKING_LIVE";
      this.broadcastSnapshot();
    }, 6000);
  }

  scheduleDemo(fn, delay) {
    const t = setTimeout(fn, delay);
    this.demoTimeouts.push(t);
  }

  reset() {
    this.demoTimeouts.forEach(clearTimeout);
    this.demoTimeouts = [];
    this.stopTicking();
    if (this.incident) {
      this.store.clearIncident(this.incident.id);
    }
    this.incident = null;
    this.phase = "idle";
    this.broadcastSnapshot();
  }
}

module.exports = { TrackingEngine, haversineKm, etaMinutes, UPDATE_INTERVAL_MS };
