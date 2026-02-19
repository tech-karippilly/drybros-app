import express from "express";
import {
  registerAdminHandler,
  loginHandler,
  loginDriverHandler,
  loginStaffHandler,
  forgotPasswordHandler,
  verifyOTPHandler,
  resetPasswordHandler,
  refreshTokenHandler,
  logoutHandler,
  getCurrentUserHandler,
  changePasswordHandler,
  registerSuperAdminHandler,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validation";
import {
  registerAdminSchema,
  loginSchema,
  driverLoginSchema,
  staffLoginSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  changePasswordSchema,
  registerSuperAdminSchema,
} from "../types/auth.dto";
import { authMiddleware } from "../middlewares/auth";
import { registerSuperAdmin } from "../services/auth.service";

const router = express.Router();

router.post("/register-super-admin", validate(registerSuperAdminSchema), registerSuperAdminHandler);
// Register admin
router.post("/register-admin", validate(registerAdminSchema), registerAdminHandler);

// User login (Admin, Manager, Office Staff)
router.post("/login", validate(loginSchema), loginHandler);

// Driver login
router.post("/login/driver", validate(driverLoginSchema), loginDriverHandler);

// Staff login
router.post("/login/staff", validate(staffLoginSchema), loginStaffHandler);

// Password reset flow
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordHandler);
router.post("/verify-otp", validate(verifyOTPSchema), verifyOTPHandler);
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordHandler);

// Refresh access token
router.post("/refresh-token", validate(refreshTokenSchema), refreshTokenHandler);

// Authenticated routes
router.post("/logout", authMiddleware, logoutHandler);
router.get("/me", authMiddleware, getCurrentUserHandler);
router.post("/change-password", authMiddleware, validate(changePasswordSchema), changePasswordHandler);

export default router;
