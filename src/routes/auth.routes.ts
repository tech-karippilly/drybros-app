import express from "express";
import {
  registerAdminHandler,
  loginHandler,
} from "../controllers/auth.controller";

const router = express.Router();

// TEMP: bootstrap admin
router.post("/register-admin", registerAdminHandler);

// Login for all users (admin, office, driver later)
router.post("/login", loginHandler);

export default router;
