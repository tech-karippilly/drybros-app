// src/routes/version.routes.js
import express from "express";

const { getVersion } = require("../controllers/version.controller");

const router = express.Router();

// GET /version
router.get("/", getVersion);

export default router;
