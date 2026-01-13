// src/routes/driver.routes.ts
import express from "express";
import { getDrivers, getDriverById } from "../controllers/driver.controller";

const router = express.Router();

router.get("/", getDrivers);
router.get("/:id", getDriverById);

export default router;
