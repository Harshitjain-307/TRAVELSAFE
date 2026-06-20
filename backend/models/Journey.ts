import { Schema, model, Document } from "mongoose";

export interface IJourney extends Document {
  userId: string;
  startLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  endLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  transportMode: "walking" | "bike" | "personal" | "cab" | "public";
  status: "ACTIVE" | "COMPLETED" | "ABORTED";
  safetyScore: number;
  routeProgress: number; // 0 to 100
  startTime: Date;
  endTime?: Date;
}

const JourneySchema = new Schema<IJourney>({
  userId: { type: String, required: true },
  startLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String
  },
  endLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String
  },
  transportMode: { type: String, enum: ["walking", "bike", "personal", "cab", "public"], default: "walking" },
  status: { type: String, enum: ["ACTIVE", "COMPLETED", "ABORTED"], default: "ACTIVE" },
  safetyScore: { type: Number, default: 90 },
  routeProgress: { type: Number, default: 0 },
  startTime: { type: Date, default: Date.now },
  endTime: Date
});

export const Journey = model<IJourney>("Journey", JourneySchema);
