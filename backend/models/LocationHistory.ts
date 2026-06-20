import { Schema, model, Document } from "mongoose";

export interface ILocationHistory extends Document {
  journeyId: string;
  responderId?: string; // empty if civilian
  lat: number;
  lng: number;
  speed: number;
  direction: number; // degrees
  timestamp: Date;
  geojson: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
}

const LocationHistorySchema = new Schema<ILocationHistory>({
  journeyId: { type: String, required: true },
  responderId: String,
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: { type: Number, default: 0 },
  direction: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  geojson: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true } // [lng, lat]
  }
});

LocationHistorySchema.index({ geojson: "2dsphere" });

export const LocationHistory = model<ILocationHistory>("LocationHistory", LocationHistorySchema);
