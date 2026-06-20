import { Router } from "express";
import {
  civilianRegister,
  civilianBiometricVerify,
  guardianLogin,
  policeLogin,
  adminLogin,
  refreshToken,
  getProfile
} from "../controllers/auth.controller";

const router = Router();

router.post("/verify-aadhaar", civilianRegister);
router.post("/biometric", civilianBiometricVerify);
router.post("/guardian/login", guardianLogin);
router.post("/police/login", policeLogin);
router.post("/admin/login", adminLogin);
router.post("/refresh", refreshToken);
router.get("/profile/:userId", getProfile);

export default router;
