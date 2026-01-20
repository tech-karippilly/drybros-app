// src/routes/franchise.routes.ts
import express from "express";
import {
  getFranchises,
  getFranchiseById,
} from "../controllers/franchise.controller";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// All franchise routes require authentication
router.use(authMiddleware);

router.get("/", getFranchises);
router.get("/:id", getFranchiseById);

export default router;
