// src/config/logger.ts
import config from "./appConfig";

const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
  },
  debug: (message: string, meta?: any) => {
    if (config.nodeEnv === "development") {
      console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
    }
  },
};

export default logger;
