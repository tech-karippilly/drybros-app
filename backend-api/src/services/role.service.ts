// src/services/role.service.ts
import {
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole as repoCreateRole,
  updateRole as repoUpdateRole,
  deleteRole as repoDeleteRole,
} from "../repositories/role.repository";

export async function listRoles() {
  return getAllRoles();
}

export async function getRole(id: string) {
  const role = await getRoleById(id);
  if (!role) {
    const error = new Error("Role not found") as any;
    error.statusCode = 404;
    throw error;
  }
  return role;
}

export async function createRole(data: {
  name: string;
  description?: string;
  isActive?: boolean;
}) {
  // Check if role with same name already exists
  const existing = await getRoleByName(data.name);
  if (existing) {
    const error = new Error("Role with this name already exists") as any;
    error.statusCode = 400;
    throw error;
  }

  return repoCreateRole(data);
}

export async function updateRole(
  id: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  // Check if role exists
  const existing = await getRoleById(id);
  if (!existing) {
    const error = new Error("Role not found") as any;
    error.statusCode = 404;
    throw error;
  }

  // If name is being updated, check if new name already exists
  if (data.name && data.name !== existing.name) {
    const nameExists = await getRoleByName(data.name);
    if (nameExists) {
      const error = new Error("Role with this name already exists") as any;
      error.statusCode = 400;
      throw error;
    }
  }

  return repoUpdateRole(id, data);
}

export async function deleteRole(id: string) {
  // Check if role exists
  const existing = await getRoleById(id);
  if (!existing) {
    const error = new Error("Role not found") as any;
    error.statusCode = 404;
    throw error;
  }

  return repoDeleteRole(id);
}
