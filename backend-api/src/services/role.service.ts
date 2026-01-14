// src/services/role.service.ts
import {
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole as repoCreateRole,
  updateRole as repoUpdateRole,
  deleteRole as repoDeleteRole,
} from "../repositories/role.repository";
import { NotFoundError, ConflictError } from "../utils/errors";
import {
  CreateRoleDTO,
  UpdateRoleDTO,
  RoleResponseDTO,
  toRoleResponseDTO,
  toRoleResponseDTOArray,
} from "../types/role.dto";

export async function listRoles(): Promise<RoleResponseDTO[]> {
  const roles = await getAllRoles();
  return toRoleResponseDTOArray(roles);
}

export async function getRole(id: string): Promise<RoleResponseDTO> {
  const role = await getRoleById(id);
  if (!role) {
    throw new NotFoundError("Role not found");
  }
  return toRoleResponseDTO(role);
}

export async function createRole(data: CreateRoleDTO): Promise<RoleResponseDTO> {
  // Check if role with same name already exists
  const existing = await getRoleByName(data.name);
  if (existing) {
    throw new ConflictError("Role with this name already exists");
  }

  const role = await repoCreateRole({
    name: data.name,
    description: data.description ?? null,
    isActive: data.isActive ?? true,
  });

  return toRoleResponseDTO(role);
}

export async function updateRole(
  id: string,
  data: UpdateRoleDTO
): Promise<RoleResponseDTO> {
  // Check if role exists
  const existing = await getRoleById(id);
  if (!existing) {
    throw new NotFoundError("Role not found");
  }

  // If name is being updated, check for conflicts
  if (data.name !== undefined && data.name !== existing.name) {
    const nameExists = await getRoleByName(data.name);
    if (nameExists) {
      throw new ConflictError("Role with this name already exists");
    }
  }

  const role = await repoUpdateRole(id, {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && {
      description: data.description ?? null,
    }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
  });

  return toRoleResponseDTO(role);
}

export async function deleteRole(id: string): Promise<void> {
  // Check if role exists
  const existing = await getRoleById(id);
  if (!existing) {
    throw new NotFoundError("Role not found");
  }

  await repoDeleteRole(id);
}
