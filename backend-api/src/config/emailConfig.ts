// src/config/emailConfig.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Gmail SMTP configuration
const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD, // Gmail App Password
  },
  from: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
  loginLink: process.env.LOGIN_LINK || "http://localhost:3000/login",
  resetPasswordLink: process.env.REST_PASSWORD || "http://localhost:3000/reset-password",
};

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
    console.error("Please check your SMTP configuration in .env file:");
    console.error("- SMTP_HOST (default: smtp.gmail.com)");
    console.error("- SMTP_PORT (default: 587)");
    console.error("- SMTP_USER or EMAIL_USER");
    console.error("- SMTP_PASSWORD or EMAIL_PASSWORD (use Gmail App Password)");
  } else {
    console.log("✓ Email transporter is ready to send messages");
    console.log("Email from:", emailConfig.from);
  }
});

export { transporter, emailConfig };
