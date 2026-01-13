// src/routes/health.routes.js
import express from "express";

const router = express.Router();

// GET /health
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API is healthy 🚗",
  });
});

export default router;
