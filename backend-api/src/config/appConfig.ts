// src/config/appConfig.ts
import dotenv from "dotenv";

dotenv.config();

// Parse comma-separated frontend URLs if multiple are provided
const parseFrontendUrls = (): string[] => {
  const urls = process.env.FRONTEND_URL_BASE || "http://localhost:3000";
  return urls.split(",").map((url) => url.trim());
};

const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  appName: process.env.APP_NAME || "Drybros Backend",
  version: process.env.APP_VERSION || "0.0.1",
  frontendUrlBase: process.env.FRONTEND_URL_BASE || "http://localhost:3000",
  frontendUrls: parseFrontendUrls(),
};

export = config;
