// src/controllers/staff.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  listStaff,
  getStaff,
  createStaff,
} from "../services/staff.service";

export async function getStaffList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listStaff();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getStaffById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const staff = await getStaff(id);
    res.json({ data: staff });
  } catch (err) {
    next(err);
  }
}

export async function createStaffHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await createStaff(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
