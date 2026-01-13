// src/services/driver.service.ts
import {
  getAllDrivers,
  getDriverById,
} from "../repositories/driver.repository";

export async function listDrivers() {
  return getAllDrivers();
}

export async function getDriver(id: number) {
  const driver = await getDriverById(id);

  if (!driver) {
    const error = new Error("Driver not found") as any;
    error.statusCode = 404;
    throw error;
  }

  return driver;
}
