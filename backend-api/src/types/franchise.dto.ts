// src/types/franchise.dto.ts
import { z } from "zod";
import { FranchiseStatus } from "@prisma/client";

/**
 * Zod schema for creating a franchise
 */
export const createFranchiseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  region: z
    .string()
    .min(1, "Region is required")
    .max(100, "Region must be less than 100 characters")
    .trim(),
  address: z
    .string()
    .min(1, "Physical address is required")
    .max(500, "Address must be less than 500 characters")
    .trim(),
  phone: z
    .string()
    .min(10, "Franchise phone is required")
    .max(20, "Franchise phone must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .trim(),
  franchiseEmail: z
    .string()
    .email("Invalid franchise email format")
    .max(255, "Franchise email must be less than 255 characters")
    .toLowerCase()
    .trim(),
  managerName: z
    .string()
    .min(1, "Manager name is required")
    .max(100, "Manager name must be less than 100 characters")
    .trim(),
  managerEmail: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase()
    .trim(),
  managerPhone: z
    .string()
    .min(10, "Manager phone number must be at least 10 characters")
    .max(20, "Manager phone number must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .trim(),
  storeImage: z
    .string()
    .url("Store image must be a valid URL")
    .max(500, "Store image URL must be less than 500 characters")
    .optional()
    .nullable(),
  legalDocumentsCollected: z
    .boolean()
    .optional()
    .default(false),
});

// Ensure franchise email and manager email are different
export const createFranchiseSchemaWithValidation = createFranchiseSchema.superRefine((data, ctx) => {
  if (data.franchiseEmail && data.managerEmail && data.franchiseEmail === data.managerEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Franchise email and manager email must be different",
      path: ["managerEmail"],
    });
  }
});

export type CreateFranchiseDTO = z.infer<typeof createFranchiseSchemaWithValidation>;

/**
 * DTO for creating a franchise (inferred from Zod schema)
 */
export type CreateFranchiseDTO = z.infer<typeof createFranchiseSchema>;

/**
 * DTO for franchise response
 */
export interface FranchiseResponseDTO {
  id: string;
  code: string;
  name: string;
  city: string;
  region: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  inchargeName: string | null;
  storeImage: string | null;
  legalDocumentsCollected: boolean;
  status: FranchiseStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Zod schema for updating a franchise
 */
export const updateFranchiseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim()
    .optional(),
  region: z
    .string()
    .min(1, "Region is required")
    .max(100, "Region must be less than 100 characters")
    .trim()
    .optional(),
  address: z
    .string()
    .min(1, "Physical address is required")
    .max(500, "Address must be less than 500 characters")
    .trim()
    .optional(),
  phone: z
    .string()
    .min(10, "Contact number must be at least 10 characters")
    .max(20, "Contact number must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .trim()
    .optional(),
  managerName: z
    .string()
    .min(1, "Manager name is required")
    .max(100, "Manager name must be less than 100 characters")
    .trim()
    .optional(),
  franchiseEmail: z
    .string()
    .email("Invalid franchise email format")
    .max(255, "Franchise email must be less than 255 characters")
    .toLowerCase()
    .trim()
    .optional(),
  storeImage: z
    .string()
    .url("Store image must be a valid URL")
    .max(500, "Store image URL must be less than 500 characters")
    .optional()
    .nullable(),
  legalDocumentsCollected: z
    .boolean()
    .optional(),
});

/**
 * DTO for updating a franchise (inferred from Zod schema)
 */
export type UpdateFranchiseDTO = z.infer<typeof updateFranchiseSchema>;

/**
 * Zod schema for updating franchise status
 */
export const updateFranchiseStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED", "TEMPORARILY_CLOSED"], {
    errorMap: () => ({ message: "Status must be ACTIVE, BLOCKED, or TEMPORARILY_CLOSED" }),
  }),
});

/**
 * DTO for updating franchise status
 */
export type UpdateFranchiseStatusDTO = z.infer<typeof updateFranchiseStatusSchema>;

/**
 * Zod schema for pagination query parameters
 */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100)),
});

/**
 * DTO for pagination query parameters
 */
export type PaginationQueryDTO = z.infer<typeof paginationQuerySchema>;

/**
 * Paginated response DTO
 */
export interface PaginatedFranchiseResponseDTO {
  data: FranchiseResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * DTO for create franchise response
 */
export interface CreateFranchiseResponseDTO {
  message: string;
  data: FranchiseResponseDTO;
}
