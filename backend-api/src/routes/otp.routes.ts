import express from "express";
import { validate } from "../middlewares/validation";
import {
  sendOtpHandler,
  verifyOtpHandler,
} from "../controllers/notification.controller";
import {
  sendOtpSchema,
  verifyOtpSchema,
} from "../types/otp.dto";

const router = express.Router();

// ============================================
// POST /api/otp/send - Send OTP
// Access: Public (for trip start/end, login)
// ============================================
router.post(
  "/send",
  validate(sendOtpSchema),
  sendOtpHandler
);

// ============================================
// POST /api/otp/verify - Verify OTP
// Access: Public
// ============================================
router.post(
  "/verify",
  validate(verifyOtpSchema),
  verifyOtpHandler
);

export default router;
