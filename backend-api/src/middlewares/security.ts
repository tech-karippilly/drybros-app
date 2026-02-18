import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

// ============================================
// RATE LIMITER (In-Memory Store)
// ============================================

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = "Too many requests" } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP + endpoint as key
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    // Reset if window expired
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, record);
      return next();
    }

    // Increment count
    record.count += 1;

    // Check if exceeded
    if (record.count > maxRequests) {
      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        path: req.path,
        count: record.count,
      });

      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000), // seconds
      });
    }

    next();
  };
}

// ============================================
// PREDEFINED RATE LIMITERS
// ============================================

// Login endpoints - 5 attempts per minute
export const loginRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: "Too many login attempts. Please try again later.",
});

// OTP endpoints - 3 attempts per 10 minutes
export const otpRateLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 3,
  message: "Too many OTP requests. Please try again later.",
});

// Payment endpoints - 10 per minute
export const paymentRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: "Too many payment requests. Please slow down.",
});

// Trip status change - 20 per minute
export const tripStatusRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  message: "Too many trip status changes. Please slow down.",
});

// ============================================
// CLEANUP EXPIRED RATE LIMIT RECORDS (Cron)
// ============================================

export function cleanupRateLimitStore() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} expired rate limit records`);
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

// ============================================
// SANITIZE INPUT MIDDLEWARE
// ============================================

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Remove unknown/dangerous fields from body
  if (req.body) {
    // Remove __proto__, constructor, prototype
    delete req.body.__proto__;
    delete req.body.constructor;
    delete req.body.prototype;

    // Trim all string values
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    }
  }

  next();
}

// ============================================
// PREVENT PARAMETER POLLUTION
// ============================================

export function preventParameterPollution(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Convert array query params to single value (take first)
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = (req.query[key] as string[])[0];
      }
    }
  }

  next();
}

// ============================================
// BLOCK SUSPICIOUS REQUESTS
// ============================================

export function blockSuspiciousRequests(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const suspiciousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL injection patterns
    /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/i, // XSS patterns
    /(\.\.)+(\/|\\)/i, // Path traversal
  ];

  const checkString = `${req.path}${JSON.stringify(req.query)}${JSON.stringify(req.body)}`;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      logger.error("Suspicious request blocked", {
        ip: req.ip,
        path: req.path,
        pattern: pattern.toString(),
      });

      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }
  }

  next();
}

// ============================================
// ENFORCE HTTPS IN PRODUCTION
// ============================================

export function enforceHttps(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "production" && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}

// ============================================
// SECURITY HEADERS MIDDLEWARE
// ============================================

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; object-src 'none';"
  );

  // HTTP Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

// ============================================
// HIDE SENSITIVE FIELDS FROM RESPONSE
// ============================================

export function hideSensitiveFields(data: any): any {
  if (!data) return data;

  const sensitiveFields = [
    "password",
    "bankAccountNumber",
    "bankIfscCode",
    "failedAttempts",
    "lockedUntil",
    "otp",
    "refreshToken",
  ];

  if (Array.isArray(data)) {
    return data.map(item => hideSensitiveFields(item));
  }

  if (typeof data === "object") {
    const cleaned = { ...data };
    for (const field of sensitiveFields) {
      delete cleaned[field];
    }
    return cleaned;
  }

  return data;
}
