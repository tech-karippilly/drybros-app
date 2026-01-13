import express from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomerHandler,
} from "../controllers/customer.controller";

const router = express.Router();

// GET /customers
router.get("/", getCustomers);

// GET /customers/:id
router.get("/:id", getCustomerById);

// POST /customers
router.post("/", createCustomerHandler);

export default router;
