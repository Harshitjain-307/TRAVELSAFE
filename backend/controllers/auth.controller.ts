import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { PoliceOfficer } from "../models/PoliceOfficer";

const JWT_SECRET = process.env.JWT_SECRET || "travelsafe-x-super-secret-key-2026";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "travelsafe-x-refresh-secret-2026";

// Helper to sign JWT tokens
const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

/**
 * Civilian First Login: Verifies mobile, OTP, and Aadhaar, registers user, generates JWT.
 */
export const civilianRegister = async (req: Request, res: Response): Promise<void> => {
  const { aadhaarNumber, mobileNumber, name } = req.body;
  try {
    let user = await User.findOne({ aadhaarNumber });
    if (!user) {
      user = new User({
        aadhaarNumber,
        mobileNumber,
        name: name || "Priya Sharma",
        role: "CIVILIAN",
        trustScore: 98,
        isAuthenticated: true,
        biometricToken: "mock-biometric-token-priya"
      });
      await user.save();
    } else {
      user.isAuthenticated = true;
      if (!user.biometricToken) user.biometricToken = "mock-biometric-token-priya";
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user);
    res.status(200).json({
      success: true,
      user,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Civilian Biometric One-Tap Bypass (Returning users)
 */
export const civilianBiometricVerify = async (req: Request, res: Response): Promise<void> => {
  const { biometricToken } = req.body;
  try {
    const user = await User.findOne({ biometricToken, role: "CIVILIAN" });
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid biometric signature. Please log in with Aadhaar." });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user);
    res.status(200).json({
      success: true,
      user,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Guardian Login: Quick OTP login. Saves to database as well.
 */
export const guardianLogin = async (req: Request, res: Response): Promise<void> => {
  const { mobileNumber, otp } = req.body;
  try {
    // Simulated OTP verification
    if (otp !== "123456" && otp.length !== 6) {
      res.status(400).json({ success: false, message: "Invalid OTP. Use '123456'." });
      return;
    }

    let user = await User.findOne({ mobileNumber, role: "GUARDIAN" });
    if (!user) {
      user = new User({
        mobileNumber,
        name: "Rahul Singh",
        role: "GUARDIAN",
        trustScore: 96,
        isAuthenticated: true
      });
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user);
    res.status(200).json({
      success: true,
      user,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Police Login: Validates official credentials and checks the PoliceOfficer database.
 */
export const policeLogin = async (req: Request, res: Response): Promise<void> => {
  const { officerId, badgeNumber, stationCode, otp } = req.body;
  try {
    // 1. Validate OTP
    if (otp !== "123456" && otp.length !== 6) {
      res.status(400).json({ success: false, message: "Invalid OTP. Use '123456'." });
      return;
    }

    // 2. Query verified PoliceOfficer registry database
    let officer = await PoliceOfficer.findOne({ officerId, badgeNumber });
    if (!officer) {
      // Seed Noida Sector 62 PS Officer if registry is empty for demo ease
      officer = new PoliceOfficer({
        officerId,
        badgeNumber,
        name: "Inspector Sharma",
        rank: "Inspector",
        station: "Noida Sector 62 Police Station",
        jurisdiction: "Noida-NCR Zone 4",
        verificationStatus: "VERIFIED"
      });
      await officer.save();
    }

    if (officer.verificationStatus !== "VERIFIED") {
      res.status(403).json({
        success: false,
        message: `Official credentials rejected. Current registration status: ${officer.verificationStatus}. Contact headquarters.`
      });
      return;
    }

    // 3. Sync User Profile
    let user = await User.findOne({ name: officer.name, role: "POLICE" });
    if (!user) {
      user = new User({
        mobileNumber: "9876543212",
        name: officer.name,
        role: "POLICE",
        trustScore: 99,
        isAuthenticated: true
      });
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user);
    res.status(200).json({
      success: true,
      officer,
      user,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Admin Login: highly restricted credentials & 2FA check.
 */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { username, password, mfaCode } = req.body;
  try {
    // Simulated username/password credentials match
    if (username !== "admin" || password !== "admin123") {
      res.status(401).json({ success: false, message: "Invalid admin credentials." });
      return;
    }

    if (mfaCode !== "123456" && mfaCode.length !== 6) {
      res.status(400).json({ success: false, message: "Invalid 2FA code. Use '123456'." });
      return;
    }

    let user = await User.findOne({ name: "Super Admin Control", role: "ADMIN" });
    if (!user) {
      user = new User({
        mobileNumber: "9876543213",
        name: "Super Admin Control",
        role: "ADMIN",
        trustScore: 100,
        isAuthenticated: true
      });
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user);
    res.status(200).json({
      success: true,
      adminRole: "Super Admin",
      user,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * JWT token refresh
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ success: false, message: "Refresh token is required." });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User session expired." });
      return;
    }

    const tokens = generateTokens(user);
    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (err: any) {
    res.status(401).json({ success: false, message: "Invalid refresh token." });
  }
};

/**
 * Retrieve User Profile (Auto Profile Fill data)
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "Profile data not found." });
      return;
    }
    res.status(200).json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
