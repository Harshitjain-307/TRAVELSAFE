import { Schema, model, Document } from "mongoose";

export interface IPoliceOfficer extends Document {
  officerId: string;
  badgeNumber: string;
  name: string;
  rank: string;
  station: string;
  jurisdiction: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REVOKED";
  createdAt: Date;
}

const PoliceOfficerSchema = new Schema<IPoliceOfficer>({
  officerId: { type: String, required: true, unique: true },
  badgeNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  rank: { type: String, required: true },
  station: { type: String, required: true },
  jurisdiction: { type: String, required: true },
  verificationStatus: { type: String, enum: ["PENDING", "VERIFIED", "REVOKED"], default: "VERIFIED" },
  createdAt: { type: Date, default: Date.now }
});

export const PoliceOfficer = model<IPoliceOfficer>("PoliceOfficer", PoliceOfficerSchema);
