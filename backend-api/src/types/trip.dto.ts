import { z } from "zod";
import { TripStatus, PaymentMode } from "@prisma/client";

// Define enums locally until Prisma client is regenerated
export enum CarType {
  HATCHBACK = "HATCHBACK",
  SEDAN = "SEDAN",
  SUV = "SUV",
  LUXURY = "LUXURY",
}

export enum Transmission {
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC",
}

// ============================================
// CREATE TRIP DTO
// ============================================

export const createTripSchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(), // Required for ADMIN only
  customerId: z.string().uuid("Invalid customer ID format").optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(10, "Customer phone must be at least 10 characters"),
  customerEmail: z.string().email("Invalid email format").optional(),
  tripType: z.string().min(1, "Trip type is required"), // From TripTypeConfig name
  pickupLocation: z.string().min(1, "Pickup location is required"),
  pickupAddress: z.string().optional(),
  pickupLat: z.number(),
  pickupLng: z.number(),
  pickupLocationNote: z.string().optional(),
  dropLocation: z.string().min(1, "Drop location is required"),
  dropAddress: z.string().optional(),
  dropLat: z.number(),
  dropLng: z.number(),
  dropLocationNote: z.string().optional(),
  scheduledAt: z.string().datetime("Invalid datetime format").optional(),
  requiredCarType: z.nativeEnum(CarType),
  requiredTransmission: z.nativeEnum(Transmission),
});

export type CreateTripDTO = z.infer<typeof createTripSchema>;

// ============================================
// ASSIGN DRIVER DTO
// ============================================

export const assignDriverSchema = z.object({
  driverId: z.string().uuid("Invalid driver ID format"),
});

export type AssignDriverDTO = z.infer<typeof assignDriverSchema>;

// ============================================
// REASSIGN DRIVER DTO
// ============================================

export const reassignDriverSchema = z.object({
  newDriverId: z.string().uuid("Invalid driver ID format"),
  reason: z.string().max(500, "Reason must be less than 500 characters").optional(),
});

export type ReassignDriverDTO = z.infer<typeof reassignDriverSchema>;

// ============================================
// RESCHEDULE TRIP DTO
// ============================================

export const rescheduleTripSchema = z.object({
  newDate: z.string().datetime("Invalid datetime format"),
  reason: z.string().max(500, "Reason must be less than 500 characters").optional(),
});

export type RescheduleTripDTO = z.infer<typeof rescheduleTripSchema>;

// ============================================
// CANCEL TRIP DTO
// ============================================

export const cancelTripSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required").max(500, "Reason must be less than 500 characters"),
});

export type CancelTripDTO = z.infer<typeof cancelTripSchema>;

// ============================================
// START TRIP DTO
// ============================================

export const startTripSchema = z.object({
  startOtp: z.string().length(6, "OTP must be exactly 6 characters"),
  startOdometer: z.number().positive("Start odometer must be a positive number"),
  driverSelfieUrl: z.string().url("Invalid driver selfie URL"),
  odometerStartImageUrl: z.string().url("Invalid odometer image URL"),
});

export type StartTripDTO = z.infer<typeof startTripSchema>;

// ============================================
// END TRIP DTO
// ============================================

export const endTripSchema = z.object({
  endOtp: z.string().length(6, "OTP must be exactly 6 characters"),
  endOdometer: z.number().positive("End odometer must be a positive number"),
  odometerEndImageUrl: z.string().url("Invalid odometer image URL"),
});

export type EndTripDTO = z.infer<typeof endTripSchema>;

// ============================================
// COLLECT PAYMENT DTO
// ============================================

export const collectPaymentSchema = z.object({
  paymentMode: z.enum(["UPI", "CASH"]),
  paymentReference: z.string().optional(),
});

export type CollectPaymentDTO = z.infer<typeof collectPaymentSchema>;

// ============================================
// LIST TRIPS QUERY DTO
// ============================================

export const listTripsQuerySchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
  driverId: z.string().uuid("Invalid driver ID format").optional(),
  status: z.nativeEnum(TripStatus).optional(),
  dateFrom: z.string().optional(), // ISO date string or simple date
  dateTo: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 10),
});

export type ListTripsQueryDTO = z.infer<typeof listTripsQuerySchema>;

// ============================================
// RESPONSE DTOs
// ============================================

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TripResponseDTO {
  id: string;
  franchiseId: string;
  driverId: string | null;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  tripType: string;
  status: TripStatus;
  pickupLocation: string;
  pickupAddress: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  pickupLocationNote: string | null;
  dropLocation: string | null;
  dropAddress: string | null;
  dropLat: number | null;
  dropLng: number | null;
  dropLocationNote: string | null;
  requiredCarType: CarType | null;
  requiredTransmission: Transmission | null;
  assignedCarId: string | null;
  scheduledAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  startOtp: string | null;
  endOtp: string | null;
  startOdometer: number | null;
  endOdometer: number | null;
  driverSelfieUrl: string | null;
  odometerStartImageUrl: string | null;
  odometerEndImageUrl: string | null;
  baseAmount: number;
  extraAmount: number;
  totalAmount: number;
  finalAmount: number;
  paymentStatus: string;
  paymentMode: PaymentMode | null;
  paymentReference: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations (optional)
  Driver?: any;
  Customer?: any;
  Franchise?: any;
  AssignedCar?: any;
}

export interface SingleTripResponseDTO {
  success: true;
  message: string;
  data: TripResponseDTO;
}

export interface TripListResponseDTO {
  success: true;
  message: string;
  data: TripResponseDTO[];
  pagination?: PaginationDTO;
}
