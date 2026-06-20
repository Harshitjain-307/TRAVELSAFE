import { Schema, model, Document } from "mongoose";

export interface IEmergency extends Document {
  journeyId: string;
  victimId: string;
  victimName: string;
  lat: number;
  lng: number;
  status: "ACTIVE" | "RESOLVED";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  type: "snatch" | "audio_panic" | "manual_sos";
  responders: {
    id: string;
    type: "guardian" | "police";
    status: "responding" | "arrived";
  }[];
  startedAt: Date;
  resolvedAt?: Date;
}

const EmergencySchema = new Schema<IEmergency>({
  journeyId: { type: String, required: true },
  victimId: { type: String, required: true },
  victimName: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  status: { type: String, enum: ["ACTIVE", "RESOLVED"], default: "ACTIVE" },
  severity: { type: String, enum: ["CRITICAL", "HIGH", "MEDIUM"], default: "CRITICAL" },
  type: { type: String, enum: ["snatch", "audio_panic", "manual_sos"], default: "manual_sos" },
  responders: [{
    id: { type: String, required: true },
    type: { type: String, enum: ["guardian", "police"], required: true },
    status: { type: String, enum: ["responding", "arrived"], default: "responding" }
  }],
  startedAt: { type: Date, default: Date.now },
  resolvedAt: Date
});

export const Emergency = model<IEmergency>("Emergency", EmergencySchema);
