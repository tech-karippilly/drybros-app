// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import config from "../config/appConfig";
import logger from "../config/logger";

export default function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = (req as any).requestId || "unknown";
  
  // Handle JSON parsing errors specifically
  if (err instanceof SyntaxError && 'body' in err) {
    logger.error('JSON parse error', {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      error: err.message,
    });
    return res.status(400).json({
      error: 'Invalid JSON format. Please check your request body for special characters or malformed JSON.',
      details: 'The request body contains invalid JSON. Make sure all special characters are properly escaped.',
    });
  }
  
  const status = err instanceof AppError ? err.statusCode : 500;

  // Log error with context
  logger.error("Request error", {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: status,
    error: err.message,
    stack: err.stack,
    ...(err instanceof AppError && { errorType: err.name }),
  });

  const message =
    err instanceof AppError
      ? err.message
      : config.nodeEnv === "production"
      ? "Something went wrong"
      : err.message;

  // Ensure error message doesn't contain control characters that break JSON
  const sanitizedMessage = message.replace(/[\x00-\x1F\x7F]/g, "");

  const response: any = {
    error: sanitizedMessage,
  };

  // Only include stack trace in development and ensure it's properly formatted
  if (config.nodeEnv === "development" && err.stack) {
    // Replace control characters in stack trace or send as array of lines
    response.stack = err.stack.split("\n").map((line: string) => line.trim());
  }

  res.status(status).json(response);
}
