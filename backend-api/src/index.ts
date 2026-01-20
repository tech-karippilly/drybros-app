// src/index.ts
import express from "express";

// Routes
import healthRoutes from "./routes/health.routes";
import versionRoutes from "./routes/version.routes";
import franchiseRoutes from "./routes/franchise.routes";
import driverRoutes from "./routes/driver.routes";
import errorHandler from "./middlewares/errorHandler";
import customerRoutes from "./routes/customer.routes";
import tripRoutes from "./routes/trip.routes";
import authRoutes from "./routes/auth.routes";
import roleRoutes from "./routes/role.routes";
import staffRoutes from "./routes/staff.routes";

import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import config from "./config/appConfig";
import logger from "./config/logger";
import { requestLogger } from "./middlewares/requestLogger";

const app = express();

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Normalize origin (remove trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, "");

    // Check if origin matches any allowed frontend URL
    const isAllowed = config.frontendUrls.some((allowedUrl) => {
      const normalizedAllowed = allowedUrl.replace(/\/$/, "");
      // Exact match (with or without trailing slash)
      return normalizedOrigin === normalizedAllowed || normalizedOrigin === allowedUrl;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    // In development, allow localhost origins on any port
    if (config.nodeEnv === "DEVELOPMENT") {
      const localhostRegex = /^https?:\/\/localhost(:\d+)?$/;
      if (localhostRegex.test(origin)) {
        return callback(null, true);
      }
    }

    // Reject other origins
    logger.warn("CORS blocked request", { 
      origin, 
      normalizedOrigin, 
      allowedUrls: config.frontendUrls,
      nodeEnv: config.nodeEnv 
    });
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // Allow cookies and authentication headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // Cache preflight requests for 24 hours
  preflightContinue: false, // Let CORS handle preflight
  optionsSuccessStatus: 204, // Return 204 for successful OPTIONS requests
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (should be early in the chain)
app.use(requestLogger);

const port = config.port;

// Load Swagger spec
const swaggerPath = path.join(__dirname, "docs", "openapi.yaml");
const swaggerDocument = YAML.load(swaggerPath);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/health", healthRoutes);
app.use("/version", versionRoutes);
app.use("/franchises", franchiseRoutes);
app.use("/drivers", driverRoutes);
app.use("/customers", customerRoutes);
app.use("/trips", tripRoutes);
app.use("/auth", authRoutes);
app.use("/roles", roleRoutes);
app.use("/staff", staffRoutes);

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Drybros backend root 🚗" });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Endpoint not found",
  });
});

app.listen(port, () => {
  logger.info("Server started", {
    port,
    environment: config.nodeEnv,
    appName: config.appName,
  });

  if (config.nodeEnv === "development") {
    logger.info("Server endpoints", {
      baseUrl: `http://localhost:${port}`,
      health: `http://localhost:${port}/health`,
      version: `http://localhost:${port}/version`,
      docs: `http://localhost:${port}/api-docs`,
    });
    logger.info("CORS configuration", {
      frontendUrls: config.frontendUrls,
      allowsLocalhost: true,
      credentials: true,
    });
  }
});
