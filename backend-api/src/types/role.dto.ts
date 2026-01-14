// src/types/role.dto.ts
import { z } from "zod";

// Type for Role model - matches Prisma schema
export type Role = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Zod schema for creating a new role
 */
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .max(100, "Role name must be less than 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .trim()
    .nullable()
    .optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Zod schema for updating an existing role
 */
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name cannot be empty")
    .max(100, "Role name must be less than 100 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .trim()
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod schema for UUID validation
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * DTO for creating a new role (inferred from Zod schema)
 */
export type CreateRoleDTO = z.infer<typeof createRoleSchema>;

/**
 * DTO for updating an existing role (inferred from Zod schema)
 */
export type UpdateRoleDTO = z.infer<typeof updateRoleSchema>;

/**
 * DTO for role response (excludes sensitive/internal fields if needed)
 */
export interface RoleResponseDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert Prisma Role model to RoleResponseDTO
 */
export function toRoleResponseDTO(role: Role): RoleResponseDTO {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

/**
 * Convert array of Prisma Role models to RoleResponseDTO array
 */
export function toRoleResponseDTOArray(roles: Role[]): RoleResponseDTO[] {
  return roles.map(toRoleResponseDTO);
}
