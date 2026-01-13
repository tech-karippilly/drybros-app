// src/services/franchise.service.ts
import {
  getAllFranchises,
  getFranchiseById,
} from "../repositories/franchise.repository";

export async function listFranchises() {
  return getAllFranchises();
}

export async function getFranchise(id: number) {
  const franchise = await getFranchiseById(id);
  if (!franchise) {
    const error = new Error("Franchise not found") as any;
    error.statusCode = 404;
    throw error;
  }
  return franchise;
}
