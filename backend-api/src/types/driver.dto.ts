// src/types/driver.dto.ts
import { z } from "zod";
import { CarType, DriverStatus } from "@prisma/client";

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
  complaintCount: number;
  bannedGlobally: boolean;
  dailyTargetAmount: number | null;
  currentRating: number | null;
  createdBy: string | null; // User UUID who created this driver
  createdAt: Date;
  updatedAt: Date;
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
