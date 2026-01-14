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

  res.status(status).json({
    error: message,
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  });
}
