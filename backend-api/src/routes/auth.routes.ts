import express from "express";
import {
  registerAdminHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  refreshTokenHandler,
  logoutHandler,
  getCurrentUserHandler,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validation";
import {
  registerAdminSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "../types/auth.dto";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// Register admin
router.post("/register-admin", validate(registerAdminSchema), registerAdminHandler);

// Login for all users (admin, office, driver later)
router.post("/login", validate(loginSchema), loginHandler);

// Forgot password - send reset link
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordHandler);

// Reset password with token
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordHandler);

// Refresh access token
router.post("/refresh-token", validate(refreshTokenSchema), refreshTokenHandler);

// Logout (requires authentication)
router.post("/logout", authMiddleware, logoutHandler);

// Get current user (requires authentication)
router.get("/me", authMiddleware, getCurrentUserHandler);

export default router;
