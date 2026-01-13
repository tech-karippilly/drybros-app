// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);

  const status = err.statusCode || 500;

  res.status(status).json({
    error: err.message || "Something went wrong",
  });
}
