// src/config/appConfig.ts
import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  appName: process.env.APP_NAME || "Drybros Backend",
  version: process.env.APP_VERSION || "0.0.1",
};

export = config;
