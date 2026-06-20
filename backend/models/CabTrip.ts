import { Schema, model, Document } from "mongoose";

export interface ICabTrip extends Document {
  journeyId: string;
  cabNumber: string;
  driverName: string;
  cabService: string;
  tripId: string;
  photoUrl?: string;
  monitoringEnabled: boolean;
  createdAt: Date;
}

const CabTripSchema = new Schema<ICabTrip>({
  journeyId: { type: String, required: true, unique: true },
  cabNumber: { type: String, required: true },
  driverName: { type: String, required: true },
  cabService: { type: String, required: true },
  tripId: { type: String, required: true },
  photoUrl: String,
  monitoringEnabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const CabTrip = model<ICabTrip>("CabTrip", CabTripSchema);
