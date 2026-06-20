import { Schema, model, Document } from "mongoose";

export interface IEvidence extends Document {
  journeyId: string;
  type: "video" | "audio";
  hash: string;
  size: string;
  timestamp: string;
  verified: boolean;
  createdAt: Date;
}

const EvidenceSchema = new Schema<IEvidence>({
  journeyId: { type: String, required: true },
  type: { type: String, enum: ["video", "audio"], required: true },
  hash: { type: String, required: true },
  size: { type: String, required: true },
  timestamp: { type: String, required: true },
  verified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Evidence = model<IEvidence>("Evidence", EvidenceSchema);
