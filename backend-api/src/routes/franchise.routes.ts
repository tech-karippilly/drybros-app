// src/routes/franchise.routes.ts
import express from "express";
import {
  getFranchises,
  getFranchiseById,
} from "../controllers/franchise.controller";

const router = express.Router();

router.get("/", getFranchises);
router.get("/:id", getFranchiseById);

export default router;
