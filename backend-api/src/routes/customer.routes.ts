import express from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomerHandler,
} from "../controllers/customer.controller";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// All customer routes require authentication
router.use(authMiddleware);

// GET /customers
router.get("/", getCustomers);

// GET /customers/:id
router.get("/:id", getCustomerById);

// POST /customers
router.post("/", createCustomerHandler);

export default router;
