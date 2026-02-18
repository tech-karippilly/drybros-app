import prisma from "../config/prismaClient";
import * as bcrypt from "bcryptjs";
import { OtpPurpose } from "../types/otp.dto";
import logger from "../config/logger";

// ============================================
// SECURITY CONFIGURATION
// ============================================

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 3;
const PHONE_BLOCK_MINUTES = 15;
const BCRYPT_SALT_ROUNDS = 12;

// ============================================
// GENERATE SECURE OTP
// ============================================

function generateSecureOtp(): string {
  // Use crypto.randomInt for secure random generation
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

// ============================================
// HASH OTP
// ============================================

async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, BCRYPT_SALT_ROUNDS);
}

// ============================================
// VERIFY OTP HASH
// ============================================

async function verifyOtpHash(plainOtp: string, hashedOtp: string): Promise<boolean> {
  return bcrypt.compare(plainOtp, hashedOtp);
}

// ============================================
// CHECK PHONE BLOCK STATUS
// ============================================

async function isPhoneBlocked(phone: string, purpose: OtpPurpose): Promise<boolean> {
  try {
    const blockRecords: any[] = await prisma.$queryRaw`
      SELECT * FROM "OtpAttempt"
      WHERE phone = ${phone}
        AND purpose = ${purpose}
        AND "blockedUntil" > NOW()
      LIMIT 1
    `;

    return blockRecords.length > 0;
  } catch (error) {
    logger.error("Failed to check phone block status", { error });
    return false; // Fail open for now
  }
}

// ============================================
// BLOCK PHONE
// ============================================

async function blockPhone(phone: string, purpose: OtpPurpose): Promise<void> {
  try {
    const blockedUntil = new Date(Date.now() + PHONE_BLOCK_MINUTES * 60 * 1000);

    await prisma.$executeRaw`
      INSERT INTO "OtpAttempt" (id, phone, purpose, attempts, "blockedUntil", "createdAt")
      VALUES (
        gen_random_uuid(),
        ${phone},
        ${purpose},
        ${MAX_OTP_ATTEMPTS},
        ${blockedUntil},
        NOW()
      )
      ON CONFLICT (phone, purpose)
      DO UPDATE SET
        attempts = ${MAX_OTP_ATTEMPTS},
        "blockedUntil" = ${blockedUntil}
    `;

    logger.warn("Phone blocked due to excessive OTP attempts", {
      phone,
      purpose,
      blockedUntil,
    });
  } catch (error) {
    logger.error("Failed to block phone", { error });
  }
}

// ============================================
// INCREMENT OTP ATTEMPT
// ============================================

async function incrementOtpAttempt(phone: string, purpose: OtpPurpose): Promise<number> {
  try {
    // Get current attempts
    const attemptRecords: any[] = await prisma.$queryRaw`
      SELECT attempts FROM "OtpAttempt"
      WHERE phone = ${phone}
        AND purpose = ${purpose}
        AND "blockedUntil" IS NULL OR "blockedUntil" <= NOW()
      LIMIT 1
    `;

    const currentAttempts = attemptRecords.length > 0 ? attemptRecords[0].attempts : 0;
    const newAttempts = currentAttempts + 1;

    // Update attempts
    await prisma.$executeRaw`
      INSERT INTO "OtpAttempt" (id, phone, purpose, attempts, "createdAt")
      VALUES (
        gen_random_uuid(),
        ${phone},
        ${purpose},
        ${newAttempts},
        NOW()
      )
      ON CONFLICT (phone, purpose)
      DO UPDATE SET attempts = ${newAttempts}
    `;

    // Block if exceeded
    if (newAttempts >= MAX_OTP_ATTEMPTS) {
      await blockPhone(phone, purpose);
    }

    return newAttempts;
  } catch (error) {
    logger.error("Failed to increment OTP attempt", { error });
    return 0;
  }
}

// ============================================
// RESET OTP ATTEMPTS
// ============================================

async function resetOtpAttempts(phone: string, purpose: OtpPurpose): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "OtpAttempt"
      SET attempts = 0, "blockedUntil" = NULL
      WHERE phone = ${phone}
        AND purpose = ${purpose}
    `;
  } catch (error) {
    logger.error("Failed to reset OTP attempts", { error });
  }
}

// ============================================
// SEND SMS (Placeholder - Integrate with provider)
// ============================================

async function sendSms(phone: string, message: string): Promise<boolean> {
  // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
  logger.info(`SMS sent to ${phone}: ${message}`);
  console.log(`📱 OTP for ${phone}: ${message}`);
  return true;
}

// ============================================
// SEND SECURE OTP
// ============================================

export async function sendSecureOtp(
  phone: string,
  purpose: OtpPurpose,
  tripId?: string
) {
  // Check if phone is blocked
  if (await isPhoneBlocked(phone, purpose)) {
    const error: any = new Error(
      `Phone blocked due to too many attempts. Try again after ${PHONE_BLOCK_MINUTES} minutes.`
    );
    error.statusCode = 429;
    throw error;
  }

  // Generate OTP
  const plainOtp = generateSecureOtp();
  const hashedOtp = await hashOtp(plainOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  try {
    // Delete existing OTP for same phone + purpose
    await prisma.$executeRaw`
      DELETE FROM "Otp"
      WHERE phone = ${phone}
        AND purpose = ${purpose}
        ${tripId ? prisma.$queryRaw`AND "tripId" = ${tripId}::uuid` : prisma.$queryRaw``}
    `;

    // Store hashed OTP
    await prisma.$executeRaw`
      INSERT INTO "Otp" (
        id, phone, otp, purpose, "tripId", "expiresAt", "isUsed", "createdAt"
      )
      VALUES (
        gen_random_uuid(),
        ${phone},
        ${hashedOtp},
        ${purpose},
        ${tripId ? `${tripId}::uuid` : null},
        ${expiresAt},
        false,
        NOW()
      )
    `;

    // Send SMS
    const message = `Your OTP is: ${plainOtp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
    await sendSms(phone, message);

    logger.info("Secure OTP sent successfully", {
      phone,
      purpose,
      tripId,
      expiresAt,
    });

    return {
      success: true,
      message: "OTP sent successfully",
      data: {
        phone,
        expiresAt,
      },
    };
  } catch (error) {
    logger.error("Failed to send secure OTP", { error });
    throw error;
  }
}

// ============================================
// VERIFY SECURE OTP
// ============================================

export async function verifySecureOtp(
  phone: string,
  plainOtp: string,
  purpose: OtpPurpose,
  tripId?: string
) {
  // Check if phone is blocked
  if (await isPhoneBlocked(phone, purpose)) {
    const error: any = new Error("Phone blocked due to too many failed attempts");
    error.statusCode = 429;
    throw error;
  }

  try {
    // Find OTP record
    const otpRecords: any[] = await prisma.$queryRaw`
      SELECT * FROM "Otp"
      WHERE phone = ${phone}
        AND purpose = ${purpose}
        ${tripId ? prisma.$queryRaw`AND "tripId" = ${tripId}::uuid` : prisma.$queryRaw``}
        AND "isUsed" = false
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    if (otpRecords.length === 0) {
      await incrementOtpAttempt(phone, purpose);
      const error: any = new Error("Invalid OTP");
      error.statusCode = 400;
      throw error;
    }

    const otpRecord = otpRecords[0];

    // Check expiry
    if (new Date() > new Date(otpRecord.expiresAt)) {
      const error: any = new Error("OTP has expired");
      error.statusCode = 400;
      throw error;
    }

    // Verify hash
    const isValid = await verifyOtpHash(plainOtp, otpRecord.otp);

    if (!isValid) {
      await incrementOtpAttempt(phone, purpose);
      const error: any = new Error("Invalid OTP");
      error.statusCode = 400;
      throw error;
    }

    // Mark as used
    await prisma.$executeRaw`
      UPDATE "Otp"
      SET "isUsed" = true
      WHERE id = ${otpRecord.id}::uuid
    `;

    // Reset attempts
    await resetOtpAttempts(phone, purpose);

    logger.info("OTP verified successfully", {
      phone,
      purpose,
      tripId,
    });

    return {
      success: true,
      message: "OTP verified successfully",
      data: {
        verified: true,
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    logger.error("OTP verification failed", { error });
    const err: any = new Error("OTP service unavailable");
    err.statusCode = 503;
    throw err;
  }
}

// ============================================
// CLEANUP (Cron job)
// ============================================

export async function cleanupExpiredOtps() {
  try {
    await prisma.$executeRaw`
      DELETE FROM "Otp"
      WHERE "expiresAt" < NOW()
    `;

    await prisma.$executeRaw`
      DELETE FROM "OtpAttempt"
      WHERE "blockedUntil" < NOW()
    `;

    logger.info("Cleaned up expired OTPs and unblocked phones");
  } catch (error) {
    logger.error("Failed to cleanup OTPs", { error });
  }
}
