// src/controllers/role.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from "../services/role.service";

export async function getRoles(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listRoles();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getRoleById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Validation middleware ensures id is a valid UUID string
    const id = String(req.params.id);
    const role = await getRole(id);
    res.json({ data: role });
  } catch (err) {
    next(err);
  }
}

export async function createRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // req.body is already validated by Zod middleware
    const role = await createRole(req.body);
    res.status(201).json({ data: role });
  } catch (err) {
    next(err);
  }
}

export async function updateRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Validation middleware ensures id is a valid UUID string
    const id = String(req.params.id);
    const role = await updateRole(id, req.body);
    res.json({ data: role });
  } catch (err) {
    next(err);
  }
}

export async function deleteRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Validation middleware ensures id is a valid UUID string
    const id = String(req.params.id);
    await deleteRole(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
