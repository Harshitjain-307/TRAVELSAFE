/**
 * In-memory GeoJSON store (MongoDB-like) for live tracking telemetry.
 */

class GeoStore {
  constructor() {
    this.incidents = new Map();
    this.telemetry = new Map();
  }

  createIncident(incident) {
    this.incidents.set(incident.id, {
      ...incident,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.telemetry.set(incident.id, []);
    return incident;
  }

  getIncident(id) {
    return this.incidents.get(id);
  }

  updateIncident(id, patch) {
    const existing = this.incidents.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.incidents.set(id, updated);
    return updated;
  }

  appendTelemetry(incidentId, record) {
    const logs = this.telemetry.get(incidentId) || [];
    logs.push({
      ...record,
      timestamp: new Date().toISOString(),
      geojson: {
        type: "Point",
        coordinates: [record.lng, record.lat],
      },
    });
    if (logs.length > 500) logs.shift();
    this.telemetry.set(incidentId, logs);
    return record;
  }

  getTelemetry(incidentId, limit = 50) {
    const logs = this.telemetry.get(incidentId) || [];
    return logs.slice(-limit);
  }

  clearIncident(id) {
    this.incidents.delete(id);
    this.telemetry.delete(id);
  }
}

module.exports = { GeoStore };
