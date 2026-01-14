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
    const id = req.params.id;
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
    const data = req.body;
    const role = await createRole(data);
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
    const id = req.params.id;
    const data = req.body;
    const role = await updateRole(id, data);
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
    const id = req.params.id;
    await deleteRole(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
