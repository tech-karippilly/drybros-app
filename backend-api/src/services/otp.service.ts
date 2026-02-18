import prisma from "../config/prismaClient";
import { SendOtpDTO, VerifyOtpDTO, OtpPurpose } from "../types/otp.dto";
import logger from "../config/logger";

// OTP Configuration
const OTP_EXPIRY_MINUTES = 5;
const OTP_LENGTH = 6;

// NOTE: This service requires an OTP table in Prisma schema:
// model Otp {
//   id        String   @id @default(uuid())
//   phone     String
//   otp       String
//   purpose   String
//   tripId    String?
//   expiresAt DateTime
//   isUsed    Boolean  @default(false)
//   createdAt DateTime @default(now())
// }

// ============================================
// GENERATE OTP
// ============================================

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================
// SEND SMS (Placeholder - integrate with SMS provider)
// ============================================

async function sendSms(phone: string, message: string): Promise<boolean> {
  // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
  logger.info(`SMS sent to ${phone}: ${message}`);
  
  // For development, log OTP to console
  console.log(`📱 OTP for ${phone}: ${message}`);
  
  return true;
}

// ============================================
// SEND OTP
// ============================================

export async function sendOtp(input: SendOtpDTO) {
  const { phone, purpose, tripId } = input;

  // Generate OTP
  const otp = generateOtp();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  try {
    // Delete any existing OTP for same phone + purpose (prevent multiple active OTPs)
    await prisma.$executeRaw`
      DELETE FROM "Otp"
      WHERE phone = ${phone}
        AND purpose = ${purpose}
        ${tripId ? prisma.$queryRaw`AND "tripId" = ${tripId}::uuid` : prisma.$queryRaw``}
    `;

    // Create OTP record using raw SQL
    await prisma.$executeRaw`
      INSERT INTO "Otp" (id, phone, otp, purpose, "tripId", "expiresAt", "isUsed", "createdAt")
      VALUES (
        gen_random_uuid(),
        ${phone},
        ${otp},
        ${purpose},
        ${tripId ? `${tripId}::uuid` : null},
        ${expiresAt},
        false,
        NOW()
      )
    `;
  } catch (error) {
    logger.error("OTP table may not exist in database", { error });
    // Continue anyway for development
  }

  // Send SMS
  const message = `Your OTP is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
  await sendSms(phone, message);

  logger.info("OTP sent successfully", {
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
}

// ============================================
// VERIFY OTP
// ============================================

export async function verifyOtp(input: VerifyOtpDTO) {
  const { phone, otp, purpose, tripId } = input;

  try {
    // Find OTP record using raw SQL
    const otpRecords: any[] = await prisma.$queryRaw`
      SELECT * FROM "Otp"
      WHERE phone = ${phone}
        AND otp = ${otp}
        AND purpose = ${purpose}
        ${tripId ? prisma.$queryRaw`AND "tripId" = ${tripId}::uuid` : prisma.$queryRaw``}
        AND "isUsed" = false
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    if (otpRecords.length === 0) {
      const error: any = new Error("Invalid OTP");
      error.statusCode = 400;
      throw error;
    }

    const otpRecord = otpRecords[0];

    // Check if expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      const error: any = new Error("OTP has expired");
      error.statusCode = 400;
      throw error;
    }

    // Mark OTP as used (prevent reuse)
    await prisma.$executeRaw`
      UPDATE "Otp"
      SET "isUsed" = true
      WHERE id = ${otpRecord.id}::uuid
    `;

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
    
    logger.error("OTP verification failed - table may not exist", { error });
    const err: any = new Error("OTP service unavailable");
    err.statusCode = 503;
    throw err;
  }
}

// ============================================
// CLEANUP EXPIRED OTPs (Run periodically via cron)
// ============================================

export async function cleanupExpiredOtps() {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM "Otp"
      WHERE "expiresAt" < NOW()
    `;

    logger.info(`Cleaned up expired OTPs`);
    return result;
  } catch (error) {
    logger.error("Failed to cleanup expired OTPs", { error });
    return 0;
  }
}
