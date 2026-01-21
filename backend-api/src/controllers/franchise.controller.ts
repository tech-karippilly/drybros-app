// src/controllers/franchise.controller.ts
import { Request, Response, NextFunction } from "express";
import { listFranchises, getFranchise, createFranchise } from "../services/franchise.service";
import { CreateFranchiseDTO } from "../types/franchise.dto";

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
    const id = req.params.id; // UUID string
    const franchise = await getFranchise(id);
    res.json({ data: franchise });
  } catch (err) {
    next(err);
  }
}

export async function createFranchiseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await createFranchise(req.body as CreateFranchiseDTO);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
