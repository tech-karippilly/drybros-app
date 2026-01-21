// src/types/franchise.dto.ts
import { z } from "zod";

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
    .min(10, "Contact number must be at least 10 characters")
    .max(20, "Contact number must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .trim(),
  inchargeName: z
    .string()
    .min(1, "Incharge name is required")
    .max(100, "Incharge name must be less than 100 characters")
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
  inchargeName: string | null;
  storeImage: string | null;
  legalDocumentsCollected: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for create franchise response
 */
export interface CreateFranchiseResponseDTO {
  message: string;
  data: FranchiseResponseDTO;
}
