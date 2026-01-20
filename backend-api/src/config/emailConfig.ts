// src/config/emailConfig.ts
import dotenv from "dotenv";

dotenv.config();

export const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
  from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@drybros.com",
  frontendUrl: process.env.FRONTEND_URL_BASE || "http://localhost:3000",
};
