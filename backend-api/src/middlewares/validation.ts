// src/middlewares/validation.ts
import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { BadRequestError } from "../utils/errors";

/**
 * Validation middleware factory
 * Creates a middleware that validates request data against a Zod schema
 */
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and transform the data, then assign back to req.body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        const errorMessage = errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ");

        return next(new BadRequestError(errorMessage));
      }
      next(error);
    }
  };
}

/**
 * Validation middleware for path parameters
 */
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and transform the params, then assign back to req.params
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        const errorMessage = errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ");

        return next(new BadRequestError(errorMessage));
      }
      next(error);
    }
  };
}

/**
 * Validation middleware for query parameters
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and transform the query, then assign to req.validatedQuery
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        const errorMessage = errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ");

        return next(new BadRequestError(errorMessage));
      }
      next(error);
    }
  };
}
