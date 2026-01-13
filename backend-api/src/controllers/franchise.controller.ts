// src/controllers/franchise.controller.ts
import { Request, Response, NextFunction } from "express";
import { listFranchises, getFranchise } from "../services/franchise.service";

export async function getFranchises(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listFranchises();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getFranchiseById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    const franchise = await getFranchise(id);
    res.json({ data: franchise });
  } catch (err) {
    next(err);
  }
}
