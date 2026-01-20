// src/types/staff.dto.ts
import { z } from "zod";

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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for create staff response
 */
export interface CreateStaffResponseDTO {
  message: string;
  data: StaffResponseDTO;
}
