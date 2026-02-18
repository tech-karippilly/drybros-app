import jwt from "jsonwebtoken";
import { authConfig } from "../config/authConfig";
import prisma from "../config/prismaClient";
import { UserRole } from "@prisma/client";
import logger from "../config/logger";

// ============================================
// TOKEN TYPES
// ============================================

export interface AccessTokenPayload {
  userId?: string;
  driverId?: string;
  staffId?: string;
  role?: UserRole;
  email: string;
  franchiseId?: string;
  type: "access";
}

export interface RefreshTokenPayload {
  userId?: string;
  driverId?: string;
  staffId?: string;
  tokenId: string; // Unique ID for token blacklisting
  type: "refresh";
}

// ============================================
// TOKEN CONFIGURATION
// ============================================

const ACCESS_TOKEN_EXPIRY = "30m"; // 30 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

// ============================================
// GENERATE ACCESS TOKEN
// ============================================

export function generateAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "access" },
    authConfig.jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

// ============================================
// GENERATE REFRESH TOKEN
// ============================================

export function generateRefreshToken(
  userId?: string,
  driverId?: string,
  staffId?: string
): string {
  const tokenId = crypto.randomUUID();
  
  return jwt.sign(
    {
      userId,
      driverId,
      staffId,
      tokenId,
      type: "refresh",
    },
    authConfig.jwtSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

// ============================================
// STORE REFRESH TOKEN (DB)
// ============================================

export async function storeRefreshToken(
  token: string,
  userId?: string,
  driverId?: string,
  staffId?: string
): Promise<void> {
  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as RefreshTokenPayload;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store in database (requires RefreshToken table in schema)
    await prisma.$executeRaw`
      INSERT INTO "RefreshToken" (id, token, "userId", "driverId", "staffId", "expiresAt", "createdAt")
      VALUES (
        ${decoded.tokenId}::uuid,
        ${token},
        ${userId || null}::uuid,
        ${driverId || null}::uuid,
        ${staffId || null}::uuid,
        ${expiresAt},
        NOW()
      )
    `;
    
    logger.info("Refresh token stored", { tokenId: decoded.tokenId });
  } catch (error) {
    logger.error("Failed to store refresh token", { error });
    // Don't throw - table may not exist yet
  }
}

// ============================================
// VERIFY REFRESH TOKEN
// ============================================

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as RefreshTokenPayload;

    // Check if token is blacklisted
    const tokenRecord: any[] = await prisma.$queryRaw`
      SELECT * FROM "RefreshToken"
      WHERE id = ${decoded.tokenId}::uuid
        AND "isRevoked" = false
        AND "expiresAt" > NOW()
      LIMIT 1
    `;

    if (tokenRecord.length === 0) {
      logger.warn("Refresh token not found or revoked", { tokenId: decoded.tokenId });
      return null;
    }

    return decoded;
  } catch (error) {
    logger.error("Refresh token verification failed", { error });
    return null;
  }
}

// ============================================
// REVOKE REFRESH TOKEN
// ============================================

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "RefreshToken"
      SET "isRevoked" = true
      WHERE id = ${tokenId}::uuid
    `;
    
    logger.info("Refresh token revoked", { tokenId });
  } catch (error) {
    logger.error("Failed to revoke refresh token", { error });
  }
}

// ============================================
// ROTATE REFRESH TOKEN
// ============================================

export async function rotateRefreshToken(
  oldToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const decoded = await verifyRefreshToken(oldToken);
    if (!decoded) return null;

    // Revoke old token
    await revokeRefreshToken(decoded.tokenId);

    // Get user/driver/staff details
    let userData: any = null;
    if (decoded.userId) {
      userData = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, franchiseId: true, fullName: true },
      });
    } else if (decoded.driverId) {
      userData = await prisma.driver.findUnique({
        where: { id: decoded.driverId },
        select: { id: true, email: true, driverCode: true, franchiseId: true },
      });
    } else if (decoded.staffId) {
      userData = await prisma.staff.findUnique({
        where: { id: decoded.staffId },
        select: { id: true, email: true, franchiseId: true },
      });
    }

    if (!userData) return null;

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      driverId: decoded.driverId,
      staffId: decoded.staffId,
      role: userData.role,
      email: userData.email,
      franchiseId: userData.franchiseId,
    });

    const newRefreshToken = generateRefreshToken(
      decoded.userId,
      decoded.driverId,
      decoded.staffId
    );

    // Store new refresh token
    await storeRefreshToken(
      newRefreshToken,
      decoded.userId,
      decoded.driverId,
      decoded.staffId
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    logger.error("Token rotation failed", { error });
    return null;
  }
}

// ============================================
// CLEANUP EXPIRED TOKENS (Cron job)
// ============================================

export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM "RefreshToken"
      WHERE "expiresAt" < NOW()
    `;
    
    logger.info("Cleaned up expired refresh tokens");
    return result as number;
  } catch (error) {
    logger.error("Failed to cleanup expired tokens", { error });
    return 0;
  }
}
