// src/index.ts
import express from "express";
import http from "http";

// Routes
import healthRoutes from "./routes/health.routes";
import versionRoutes from "./routes/version.routes";
import franchiseRoutes from "./routes/franchise.routes";
import driverRoutes from "./routes/driver.routes";
import errorHandler from "./middlewares/errorHandler";
import customerRoutes from "./routes/customer.routes";
import tripRoutes from "./routes/trip.routes";
import tripOfferRoutes from "./routes/tripOffer.routes";
import authRoutes from "./routes/auth.routes";
import roleRoutes from "./routes/role.routes";
import staffRoutes from "./routes/staff.routes";
import tripTypeRoutes from "./routes/tripType.routes";
import complaintRoutes from "./routes/complaint.routes";
import attendanceRoutes from "./routes/attendance.routes";
import leaveRoutes from "./routes/leave.routes";
import ratingRoutes from "./routes/rating.routes";
import activityRoutes from "./routes/activity.routes";
import penaltyRoutes from "./routes/penalty.routes";
import earningsConfigRoutes from "./routes/earningsConfig.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import alertsRoutes from "./routes/alerts.routes";
import reviewRoutes from "./routes/review.routes";

import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import config from "./config/appConfig";
import logger from "./config/logger";
import { requestLogger } from "./middlewares/requestLogger";
import { socketService } from "./services/socket.service";

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

// Custom JSON parser that handles control characters gracefully
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('application/json')) {
    let body = '';
    req.setEncoding('utf8');
    
    req.on('data', (chunk) => {
      body += chunk;
    });
    
    req.on('end', () => {
      try {
        // First, try to parse as-is
        req.body = JSON.parse(body);
        next();
      } catch (err: any) {
        // If parsing fails, try sanitizing control characters and parse again
        try {
          // Remove unescaped control characters (but keep escaped ones like \n, \t)
          // This regex removes control chars that aren't part of escape sequences
          const sanitized = body
            .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
            .replace(/\r\n/g, ' ') // Replace CRLF with space
            .replace(/\n/g, ' ') // Replace LF with space
            .replace(/\r/g, ' ') // Replace CR with space
            .replace(/\t/g, ' '); // Replace tabs with space
          
          req.body = JSON.parse(sanitized);
          logger.warn('JSON sanitized due to control characters', {
            url: req.url,
            method: req.method,
          });
          next();
        } catch (parseErr: any) {
          logger.error('JSON parse error after sanitization', {
            error: parseErr.message,
            originalError: err.message,
            url: req.url,
            method: req.method,
            bodyPreview: body.substring(0, 200), // Log first 200 chars for debugging
          });
          return res.status(400).json({
            error: 'Invalid JSON format. Please check your request body for special characters or malformed JSON.',
            details: 'The request body contains invalid characters that cannot be parsed as JSON.',
          });
        }
      }
    });
    
    req.on('error', (err) => {
      next(err);
    });
  } else {
    // For non-JSON content, use default express parsers
    express.json({ 
      strict: false,
      limit: '10mb',
    })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use("/trip-offers", tripOfferRoutes);
app.use("/auth", authRoutes);
app.use("/roles", roleRoutes);
app.use("/staff", staffRoutes);
app.use("/trip-types", tripTypeRoutes);
app.use("/complaints", complaintRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/leave-requests", leaveRoutes);
app.use("/ratings", ratingRoutes);
app.use("/activities", activityRoutes);
app.use("/penalties", penaltyRoutes);
app.use("/config", earningsConfigRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/alerts", alertsRoutes);
app.use("/reviews", reviewRoutes);

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

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO
socketService.initialize(httpServer);

// Start server
httpServer.listen(port, () => {
  logger.info("Server started", {
    port,
    environment: config.nodeEnv,
    appName: config.appName,
  });

  if (config.nodeEnv === "DEVELOPMENT") {
    logger.info("Server endpoints", {
      baseUrl: `http://localhost:${port}`,
      health: `http://localhost:${port}/health`,
      version: `http://localhost:${port}/version`,
      docs: `http://localhost:${port}/api-docs`,
      socket: `Socket.IO enabled on port ${port}`,
    });
    logger.info("CORS configuration", {
      frontendUrls: config.frontendUrls,
      allowsLocalhost: true,
      credentials: true,
    });
  }
});
