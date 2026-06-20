import { Schema, model, Document } from "mongoose";

export interface IGuardian extends Document {
  userId: string;
  name: string;
  lat: number;
  lng: number;
  status: "standby" | "responding" | "arrived" | "offline";
  rankPoints: number;
  coverageRadiusKm: number;
  updatedAt: Date;
}

const GuardianSchema = new Schema<IGuardian>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  status: { type: String, enum: ["standby", "responding", "arrived", "offline"], default: "standby" },
  rankPoints: { type: Number, default: 0 },
  coverageRadiusKm: { type: Number, default: 5 },
  updatedAt: { type: Date, default: Date.now }
});

export const Guardian = model<IGuardian>("Guardian", GuardianSchema);
