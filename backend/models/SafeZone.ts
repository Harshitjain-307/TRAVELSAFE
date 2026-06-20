import { Schema, model, Document } from "mongoose";

export interface ISafeZone extends Document {
  name: string;
  type: "hospital" | "police" | "safe_store" | "metro_security" | "guardian_hub";
  lat: number;
  lng: number;
  openHours: string;
  crowdLevel: "Low" | "Medium" | "High";
  rating: number;
}

const SafeZoneSchema = new Schema<ISafeZone>({
  name: { type: String, required: true },
  type: { type: String, enum: ["hospital", "police", "safe_store", "metro_security", "guardian_hub"], required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  openHours: { type: String, default: "24/7" },
  crowdLevel: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
  rating: { type: Number, default: 4.8 }
});

export const SafeZone = model<ISafeZone>("SafeZone", SafeZoneSchema);
