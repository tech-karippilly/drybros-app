// src/types/staff.dto.ts
import { z } from "zod";
import { StaffStatus, RelieveReason } from "@prisma/client";

/**
 * RelieveReason enum for Zod validation
 */
export const relieveReasonEnum = z.enum([
  "RESIGNATION",
  "TERMINATION",
  "RETIREMENT",
  "CONTRACT_ENDED",
  "PERFORMANCE_ISSUES",
  "MISCONDUCT",
  "OTHER",
]);

/**
 * Zod schema for creating a staff member
 */
export const createStaffSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  franchiseId: z
    .string()
    .uuid("Franchise ID must be a valid UUID"),
  monthlySalary: z
    .union([
      z.number().positive("Monthly salary must be a positive number"),
      z.string().regex(/^\d+(\.\d+)?$/, "Monthly salary must be a valid number").transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          throw new Error("Monthly salary must be a positive number");
        }
        return num;
      }),
    ])
    .pipe(z.number().positive()),
  address: z
    .string()
    .min(1, "Address is required")
    .max(500, "Address must be less than 500 characters")
    .trim(),
  emergencyContact: z
    .string()
    .min(10, "Emergency contact must be at least 10 characters")
    .max(20, "Emergency contact must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .trim(),
  emergencyContactRelation: z
    .string()
    .min(1, "Emergency contact relation is required")
    .max(50, "Relation must be less than 50 characters")
    .trim(),
  govtId: z
    .boolean()
    .optional()
    .default(false),
  addressProof: z
    .boolean()
    .optional()
    .default(false),
  certificates: z
    .boolean()
    .optional()
    .default(false),
  previousExperienceCert: z
    .boolean()
    .optional()
    .default(false),
  profilePic: z
    .string()
    .max(500, "Profile picture URL must be less than 500 characters")
    .url("Profile picture must be a valid URL")
    .optional()
    .nullable(),
  joinDate: z
    .union([
      z.string().datetime("Invalid date format").transform((val) => new Date(val)),
      z.date(),
    ])
    .optional()
    .default(new Date()),
});

/**
 * DTO for creating a staff member (inferred from Zod schema)
 */
export type CreateStaffDTO = z.infer<typeof createStaffSchema>;

/**
 * DTO for staff response
 */
export interface StaffResponseDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  franchiseId: string;
  monthlySalary: number;
  address: string;
  emergencyContact: string;
  emergencyContactRelation: string;
  govtId: boolean;
  addressProof: boolean;
  certificates: boolean;
  previousExperienceCert: boolean;
  profilePic: string | null;
  status: StaffStatus;
  suspendedUntil: Date | null;
  joinDate: Date;
  relieveDate: Date | null;
  relieveReason: RelieveReason | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  franchise?: {
    id: string;
    code: string;
    name: string;
    city: string;
    region: string | null;
  } | null;
}

/**
 * Staff details response (GET /staff/:id) - includes statistics, no franchiseId/createdAt/updatedAt, trimmed franchise
 */
export interface StaffDetailsResponseDTO extends Omit<StaffResponseDTO, "franchiseId" | "createdAt" | "updatedAt" | "franchise"> {
  franchise?: {
    id: string;
    code: string;
    name: string;
  } | null;
  statistics: {
    totalCustomers: number;
    totalTripsAssigned: number;
    totalWorkingDays: number;
    totalLeaves: number;
    totalComplaints: number;
    totalWarnings: number;
  };
}

/**
 * DTO for create staff response
 */
export interface CreateStaffResponseDTO {
  message: string;
  data: StaffResponseDTO;
}

/**
 * Zod schema for updating a staff member
 */
export const updateStaffSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim()
    .optional(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase()
    .trim()
    .optional(),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .trim()
    .optional(),
  franchiseId: z
    .string()
    .uuid("Franchise ID must be a valid UUID")
    .optional(),
  monthlySalary: z
    .union([
      z.number().positive("Monthly salary must be a positive number"),
      z.string().regex(/^\d+(\.\d+)?$/, "Monthly salary must be a valid number").transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          throw new Error("Monthly salary must be a positive number");
        }
        return num;
      }),
    ])
    .pipe(z.number().positive())
    .optional(),
  address: z
    .string()
    .min(1, "Address is required")
    .max(500, "Address must be less than 500 characters")
    .trim()
    .optional(),
  emergencyContact: z
    .string()
    .min(10, "Emergency contact must be at least 10 characters")
    .max(20, "Emergency contact must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .trim()
    .optional(),
  emergencyContactRelation: z
    .string()
    .min(1, "Emergency contact relation is required")
    .max(50, "Relation must be less than 50 characters")
    .trim()
    .optional(),
  govtId: z.boolean().optional(),
  addressProof: z.boolean().optional(),
  certificates: z.boolean().optional(),
  previousExperienceCert: z.boolean().optional(),
  profilePic: z
    .string()
    .max(500, "Profile picture URL must be less than 500 characters")
    .url("Profile picture must be a valid URL")
    .optional()
    .nullable(),
  relieveDate: z
    .union([
      z.string().datetime("Invalid date format").transform((val) => new Date(val)),
      z.date(),
      z.null(),
    ])
    .optional()
    .nullable(),
  relieveReason: relieveReasonEnum.optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * DTO for updating a staff member (inferred from Zod schema)
 */
export type UpdateStaffDTO = z.infer<typeof updateStaffSchema>;

/**
 * Zod schema for updating staff status (fire, suspend, block)
 */
export const updateStaffStatusSchema = z.object({
  status: z.enum(["FIRED", "SUSPENDED", "BLOCKED", "ACTIVE"], {
    errorMap: () => ({ message: "Status must be one of: FIRED, SUSPENDED, BLOCKED, ACTIVE" }),
  }),
  suspendedUntil: z
    .union([
      z.string().datetime("Invalid date format").transform((val) => new Date(val)),
      z.date(),
      z.null(),
    ])
    .optional()
    .nullable(),
});

/**
 * DTO for updating staff status
 */
export type UpdateStaffStatusDTO = z.infer<typeof updateStaffStatusSchema>;

/**
 * Response DTO for staff status update
 */
export interface StaffStatusResponseDTO {
  message: string;
  data: StaffResponseDTO;
}

/**
 * Staff History DTOs
 */
export interface StaffHistoryDTO {
  id: string;
  staffId: string;
  action: string;
  description: string | null;
  changedBy: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
}

export interface StaffHistoryResponseDTO {
  data: StaffHistoryDTO[];
}

/**
 * Pagination query parameters schema
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
    .pipe(z.number().int().positive().max(100)), // Max 100 items per page
  franchiseId: z
    .string()
    .uuid("Franchise ID must be a valid UUID")
    .optional(),
});

/**
 * Pagination query DTO
 */
export type PaginationQueryDTO = z.infer<typeof paginationQuerySchema>;

/**
 * Paginated response DTO
 */
export interface PaginatedStaffResponseDTO {
  data: StaffResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
