// src/middlewares/requestLogger.ts
import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

/**
 * Request/Response logging middleware
 * Logs all incoming requests and their responses
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  // Add request ID to request object for tracing
  (req as any).requestId = requestId;

  // Log incoming request
  logger.info("Incoming request", {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
    contentType: req.get("content-type"),
    ...(req.body && Object.keys(req.body).length > 0 && {
      body: sanitizeRequestBody(req.body),
    }),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (body: any) {
    const duration = Date.now() - startTime;

    // Log response
    logger.info("Request completed", {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ...(res.statusCode >= 400 && {
        responseBody: sanitizeResponseBody(body),
      }),
    });

    // Call original send
    return originalSend.call(this, body);
  };

  next();
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== "object") {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ["password", "token", "secret", "authorization"];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "***REDACTED***";
    }
  }

  return sanitized;
}

/**
 * Sanitize response body to remove sensitive information
 */
function sanitizeResponseBody(body: any): any {
  if (!body) {
    return body;
  }

  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    return sanitizeRequestBody(parsed);
  } catch {
    return body;
  }
}
