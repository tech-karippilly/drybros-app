// src/types/driver.dto.ts
import { z } from "zod";
import { DriverStatus, DriverTripStatus } from "@prisma/client";

// Define enum types locally until Prisma client is regenerated
export type CarType = "HATCHBACK" | "SEDAN" | "SUV" | "LUXURY";
export type Transmission = "MANUAL" | "AUTOMATIC";

// Driver Employment Type Enum Schema (API-facing string values)
export const driverEmploymentTypeEnum = z.enum(["part time", "full time", "contract"]);

// Create Driver Schema
export const createDriverSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  altPhone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone is required"),
  emergencyContactRelation: z.string().min(1, "Emergency contact relation is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseType: z.string().min(1, "License type is required"),
  employmentType: driverEmploymentTypeEnum,
  licenseExpDate: z
    .union([
      z.string().datetime("Invalid date format").transform((val) => new Date(val)),
      z.date(),
    ])
    .refine((date) => date > new Date(), {
      message: "License expiration date must be in the future",
    }),
  bankAccountName: z.string().min(1, "Bank account name is required"),
  bankAccountNumber: z.string().min(1, "Bank account number is required"),
  bankIfscCode: z.string().min(1, "IFSC code is required"),
  aadharCard: z.boolean().default(false),
  license: z.boolean().default(false),
  educationCert: z.boolean().default(false),
  previousExp: z.boolean().default(false),
  franchiseId: z.string().uuid("Franchise ID must be a valid UUID").optional(), // Optional, required only for ADMIN
});

export type CreateDriverDTO = z.infer<typeof createDriverSchema>;

// Driver Car Schema
export const createDriverCarSchema = z.object({
  carType: z.enum(["HATCHBACK", "SEDAN", "SUV", "LUXURY"]),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
  brand: z.string().min(1, "Brand is required").optional(),
  model: z.string().min(1, "Model is required").optional(),
  registrationNo: z.string().min(1, "Registration number is required"),
  color: z.string().min(1, "Color is required").optional(),
  isPrimary: z.boolean().default(false),
});

export type CreateDriverCarDTO = z.infer<typeof createDriverCarSchema>;

// Update Driver Car Schema
export const updateDriverCarSchema = z.object({
  brand: z.string().min(1, "Brand is required").optional(),
  model: z.string().min(1, "Model is required").optional(),
  color: z.string().min(1, "Color is required").optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

export type UpdateDriverCarDTO = z.infer<typeof updateDriverCarSchema>;

// Driver Car Response DTO
export interface DriverCarResponseDTO {
  id: string;
  driverId: string;
  carType: CarType;
  transmission: Transmission;
  brand: string | null;
  model: string | null;
  registrationNo: string;
  color: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Driver Response DTO
export interface DriverResponseDTO {
  id: string;
  franchiseId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  altPhone: string | null;
  driverCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  licenseNumber: string;
  licenseType: string | null;
  employmentType: string | null;
  licenseExpDate: Date;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  aadharCard: boolean;
  license: boolean;
  educationCert: boolean;
  previousExp: boolean;
  status: DriverStatus;
  driverTripStatus: DriverTripStatus;
  complaintCount: number;
  warningCount: number;
  blacklisted: boolean;
  bannedGlobally: boolean;
  currentRating: number | null;
  onlineStatus: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  cars?: DriverCarResponseDTO[]; // Optional cars array
}

// Driver Self Profile Response DTO (without sensitive data)
export interface DriverSelfProfileResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  driverCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  licenseNumber: string;
  licenseExpDate: Date;
  status: DriverStatus;
  driverTripStatus: DriverTripStatus;
  currentRating: number | null;
  onlineStatus: boolean;
  cars?: DriverCarResponseDTO[];
}

// Standardized Response DTOs
export interface SingleDriverResponseDTO {
  success: true;
  message: string;
  data: DriverResponseDTO;
}

export interface CreateDriverResponseDTO {
  success: true;
  message: string;
  data: DriverResponseDTO;
}

export interface UpdateDriverResponseDTO {
  success: true;
  message: string;
  data: DriverResponseDTO;
}

export interface DriverSelfProfileResponse {
  success: true;
  message: string;
  data: DriverSelfProfileResponseDTO;
}

export interface DriverCarsResponseDTO {
  success: true;
  message: string;
  data: DriverCarResponseDTO[];
}

export interface SingleDriverCarResponseDTO {
  success: true;
  message: string;
  data: DriverCarResponseDTO;
}

// Driver Login DTOs
export const driverLoginSchema = z.object({
  driverCode: z.string().min(1, "Driver code is required").toUpperCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export type DriverLoginDTO = z.infer<typeof driverLoginSchema>;

export interface DriverLoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  driver: {
    id: string;
    driverCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
  };
}

// Update Driver Schema (all fields optional for partial updates)
export const updateDriverSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phone: z.string().min(10, "Phone number is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  altPhone: z.string().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required").optional(),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone is required").optional(),
  emergencyContactRelation: z.string().min(1, "Emergency contact relation is required").optional(),
  address: z.string().min(1, "Address is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  pincode: z.string().min(6, "Pincode is required").optional(),
  licenseNumber: z.string().min(1, "License number is required").optional(),
  licenseType: z.string().min(1, "License type is required").optional(),
  employmentType: driverEmploymentTypeEnum.optional().nullable(),
  licenseExpDate: z
    .union([
      z.string().datetime("Invalid date format").transform((val) => new Date(val)),
      z.date(),
    ])
    .optional(),
  bankAccountName: z.string().min(1, "Bank account name is required").optional(),
  bankAccountNumber: z.string().min(1, "Bank account number is required").optional(),
  bankIfscCode: z.string().min(1, "IFSC code is required").optional(),
  aadharCard: z.boolean().optional(),
  license: z.boolean().optional(),
  educationCert: z.boolean().optional(),
  previousExp: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

export type UpdateDriverDTO = z.infer<typeof updateDriverSchema>;

// Update Driver Status DTOs
export const updateDriverStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED", "TERMINATED"], {
    message: "Status must be one of: ACTIVE, INACTIVE, BLOCKED, TERMINATED",
  }),
});

export type UpdateDriverStatusDTO = z.infer<typeof updateDriverStatusSchema>;

export interface UpdateDriverStatusResponseDTO {
  success: true;
  message: string;
  data: DriverResponseDTO;
}

// List Drivers Query Schema
export const listDriversQuerySchema = z.object({
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
  franchiseId: z
    .string()
    .uuid("Franchise ID must be a valid UUID")
    .optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "BLOCKED", "TERMINATED"])
    .optional(),
  employmentType: driverEmploymentTypeEnum.optional(),
  search: z.string().trim().optional(), // Search by name or phone
});

export type ListDriversQueryDTO = z.infer<typeof listDriversQuerySchema>;

export interface PaginatedDriverResponseDTO {
  success: true;
  message: string;
  data: DriverResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Submit Cash for Settlement Schema
export const submitCashForSettlementSchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID"),
  settlementAmount: z.number().positive("Settlement amount must be positive"),
});

export type SubmitCashForSettlementDTO = z.infer<typeof submitCashForSettlementSchema>;
