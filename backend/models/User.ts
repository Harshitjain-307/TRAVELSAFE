import { Schema, model, Document } from "mongoose";

export interface IEmergencyContact {
  name: string;
  phone: string;
}

export interface IUser extends Document {
  aadhaarNumber?: string;
  mobileNumber: string;
  name: string;
  role: "CIVILIAN" | "GUARDIAN" | "POLICE" | "ADMIN";
  trustScore: number;
  isAuthenticated: boolean;
  passwordHash?: string; // For Admin login credentials
  biometricToken?: string; // Token verified during biometric bypass
  homeAddress?: string;
  officeAddress?: string;
  emergencyContacts: IEmergencyContact[];
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  aadhaarNumber: { type: String, unique: true, sparse: true },
  mobileNumber: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["CIVILIAN", "GUARDIAN", "POLICE", "ADMIN"], default: "CIVILIAN" },
  trustScore: { type: Number, default: 95 },
  isAuthenticated: { type: Boolean, default: false },
  passwordHash: String,
  biometricToken: String,
  homeAddress: { type: String, default: "CP External Circular Rd, New Delhi" },
  officeAddress: { type: String, default: "Noida Sector 62, Fortis Block" },
  emergencyContacts: {
    type: [{ name: String, phone: String }],
    default: [
      { name: "Father", phone: "9876543210" },
      { name: "Sister", phone: "9876543211" }
    ]
  },
  createdAt: { type: Date, default: Date.now }
});

export const User = model<IUser>("User", UserSchema);
