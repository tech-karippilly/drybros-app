// src/types/franchise.dto.ts
import { z } from "zod";
import { FranchiseStatus } from "@prisma/client";

/**
 * Zod schema for creating a franchise
 */
export const createFranchiseSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be less than 50 characters")
    .trim(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters")
    .trim(),
  region: z
    .string()
    .max(100, "Region must be less than 100 characters")
    .trim()
    .optional(),
  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .trim()
    .optional(),
  phone: z
    .string()
    .max(20, "Phone must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .trim()
    .optional(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase()
    .trim()
    .optional(),
  inchargeName: z
    .string()
    .max(100, "Incharge name must be less than 100 characters")
    .trim()
    .optional(),
  managerEmail: z
    .string()
    .email("Invalid manager email format")
    .max(255, "Manager email must be less than 255 characters")
    .toLowerCase()
    .trim()
    .optional(),
  managerPhone: z
    .string()
    .max(20, "Manager phone must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/, "Invalid manager phone number format")
    .trim()
    .optional(),
  storeImage: z
    .string()
    .url("Store image must be a valid URL")
    .max(500, "Store image URL must be less than 500 characters")
    .optional()
    .nullable(),
  legalDocumentsCollected: z.boolean().optional().default(false),
});

export type CreateFranchiseDTO = z.infer<typeof createFranchiseSchema>;

/**
 * DTO for franchise response (list view)
 */
export interface FranchiseListItemDTO {
  id: string;
  code: string;
  name: string;
  city: string;
  status: FranchiseStatus;
  isActive: boolean;
  createdAt: Date;
}

/**
 * DTO for franchise response (full details)
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
  managerEmail: string | null;
  managerPhone: string | null;
  storeImage: string | null;
  legalDocumentsCollected: boolean;
  status: FranchiseStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
  driverCount?: number;
  staffCount?: number;
  monthlyRevenue?: number;
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
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters")
    .trim()
    .optional(),
  region: z
    .string()
    .max(100, "Region must be less than 100 characters")
    .trim()
    .optional(),
  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .trim()
    .optional(),
  phone: z
    .string()
    .max(20, "Phone must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .trim()
    .optional(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase()
    .trim()
    .optional(),
  inchargeName: z
    .string()
    .max(100, "Incharge name must be less than 100 characters")
    .trim()
    .optional(),
  managerEmail: z
    .string()
    .email("Invalid manager email format")
    .max(255, "Manager email must be less than 255 characters")
    .toLowerCase()
    .trim()
    .optional(),
  managerPhone: z
    .string()
    .max(20, "Manager phone must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/, "Invalid manager phone number format")
    .trim()
    .optional(),
  storeImage: z
    .string()
    .url("Store image must be a valid URL")
    .max(500, "Store image URL must be less than 500 characters")
    .optional()
    .nullable(),
  legalDocumentsCollected: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateFranchiseDTO = z.infer<typeof updateFranchiseSchema>;

/**
 * Zod schema for updating franchise status
 */
export const updateFranchiseStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED", "TEMPORARILY_CLOSED"]),
});

export type UpdateFranchiseStatusDTO = z.infer<typeof updateFranchiseStatusSchema>;

/**
 * Zod schema for list query parameters with search and filter
 */
export const listFranchisesQuerySchema = z.object({
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
  search: z
    .string()
    .trim()
    .optional(),
  status: z
    .enum(["ACTIVE", "BLOCKED", "TEMPORARILY_CLOSED"])
    .optional(),
});

export type ListFranchisesQueryDTO = z.infer<typeof listFranchisesQuerySchema>;

/**
 * Zod schema for pagination query parameters (backward compatibility)
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

export type PaginationQueryDTO = z.infer<typeof paginationQuerySchema>;

/**
 * Paginated response DTO
 */
export interface PaginatedFranchiseResponseDTO {
  success: true;
  message: string;
  data: FranchiseListItemDTO[];
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
 * Single franchise response DTO
 */
export interface SingleFranchiseResponseDTO {
  success: true;
  message: string;
  data: FranchiseResponseDTO;
}

/**
 * Create franchise response DTO
 */
export interface CreateFranchiseResponseDTO {
  success: true;
  message: string;
  data: FranchiseResponseDTO;
}

/**
 * Update franchise response DTO
 */
export interface UpdateFranchiseResponseDTO {
  success: true;
  message: string;
  data: FranchiseResponseDTO;
}

/**
 * Standard success response DTO
 */
export interface SuccessResponseDTO {
  success: true;
  message: string;
}

/**
 * Standard error response DTO
 */
export interface ErrorResponseDTO {
  success: false;
  message: string;
}
