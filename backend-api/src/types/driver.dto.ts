// src/types/driver.dto.ts
import { z } from "zod";
import { CarType, DriverStatus, DriverTripStatus } from "@prisma/client";
import { DriverPerformanceCategory } from "../constants/driver";

// CarType enum schema
export const carTypeEnum = z.enum([
  "MANUAL",
  "AUTOMATIC",
  "PREMIUM_CARS",
  "LUXURY_CARS",
  "SPORTY_CARS",
]);

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
  carTypes: z.array(carTypeEnum).min(1, "At least one car type is required"),
  franchiseId: z.string().uuid("Franchise ID must be a valid UUID"),
});

export type CreateDriverDTO = z.infer<typeof createDriverSchema>;

// Driver Performance Metrics DTO
export interface DriverPerformanceMetricsDTO {
  category: DriverPerformanceCategory;
  score: number; // 0-100
  rating: number | null;
  complaintCount: number;
  totalTrips: number;
  completedTrips: number;
  rejectedTrips: number;
  completionRate: number; // percentage
  rejectionRate: number; // percentage
}

// Driver Response DTO
export interface DriverResponseDTO {
  id: string; // UUID
  franchiseId: string; // UUID
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
  licenseExpDate: Date;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  aadharCard: boolean;
  license: boolean;
  educationCert: boolean;
  previousExp: boolean;
  carTypes: CarType[];
  status: DriverStatus;
  driverTripStatus: DriverTripStatus;
  complaintCount: number;
  bannedGlobally: boolean;
  dailyTargetAmount: number | null;
  cashInHand: number;
  incentive: number | null;
  bonus: number | null;
  currentRating: number | null;
  isActive: boolean;
  createdBy: string | null; // User UUID who created this driver
  createdAt: Date;
  updatedAt: Date;
  performance?: DriverPerformanceMetricsDTO; // Optional performance metrics
}

export interface CreateDriverResponseDTO {
  message: string;
  data: DriverResponseDTO;
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
  carTypes: z.array(carTypeEnum).min(1, "At least one car type is required").optional(),
  franchiseId: z.string().uuid("Franchise ID must be a valid UUID").optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED", "TERMINATED"]).optional(),
  dailyTargetAmount: z.number().int().positive().optional().nullable(),
  incentive: z.number().nonnegative("Incentive must be non-negative").optional().nullable(),
  bonus: z.number().nonnegative("Bonus must be non-negative").optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

export type UpdateDriverDTO = z.infer<typeof updateDriverSchema>;

export interface UpdateDriverResponseDTO {
  message: string;
  data: DriverResponseDTO;
}

// Update Driver Status DTOs
export const updateDriverStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED", "TERMINATED"], {
    errorMap: () => ({ message: "Status must be one of: ACTIVE, INACTIVE, BLOCKED, TERMINATED" }),
  }),
});

export type UpdateDriverStatusDTO = z.infer<typeof updateDriverStatusSchema>;

export interface UpdateDriverStatusResponseDTO {
  message: string;
  data: DriverResponseDTO;
}

// Pagination DTOs
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

export type PaginationQueryDTO = z.infer<typeof paginationQuerySchema>;

export interface PaginatedDriverResponseDTO {
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

// Driver with Performance Response DTO (performance is required)
export interface DriverWithPerformanceResponseDTO extends DriverResponseDTO {
  performance: DriverPerformanceMetricsDTO; // Required (not optional)
}

// Submit Cash for Settlement Schema
export const submitCashForSettlementSchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID"),
  settlementAmount: z
    .number()
    .positive("Settlement amount must be greater than zero")
    .refine((val) => val > 0, {
      message: "Settlement amount must be greater than zero",
    }),
});

export type SubmitCashForSettlementDTO = z.infer<typeof submitCashForSettlementSchema>;

export interface SubmitCashForSettlementResponseDTO {
  driverId: string;
  driverName: string;
  message: string;
  previousCash: number;
  settlementAmount: number;
  remainingCash: number;
}
