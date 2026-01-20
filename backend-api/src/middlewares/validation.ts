// src/middlewares/validation.ts
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BadRequestError } from "../utils/errors";

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return next(new BadRequestError(JSON.stringify(errorMessages)));
      }
      next(error);
    }
  };
}
