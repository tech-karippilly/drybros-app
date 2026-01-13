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

import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import config from "./config/appConfig";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  console.log(`\n\n\nDrybros backend running at http://localhost:${port}`);
  console.log(`Health:   http://localhost:${port}/health`);
  console.log(`Version:  http://localhost:${port}/version`);
  console.log(`Docs:     http://localhost:${port}/api-docs`);
});
