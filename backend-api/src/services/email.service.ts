// src/services/email.service.ts
import nodemailer from "nodemailer";
import { emailConfig } from "../config/emailConfig";
import logger from "../config/logger";

// Create transporter (will be initialized lazily)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!transporter && emailConfig.auth.user && emailConfig.auth.pass) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }
  return transporter;
}

export interface SendDriverWelcomeEmailParams {
  email: string;
  driverName: string;
  driverCode: string;
  appPassword: string;
  webPassword: string;
  webLoginLink: string;
}

export async function sendDriverWelcomeEmail(
  params: SendDriverWelcomeEmailParams
): Promise<void> {
  const { email, driverName, driverCode, appPassword, webPassword, webLoginLink } = params;

  const transporter = getTransporter();
  if (!transporter) {
    logger.warn("Email transporter not configured. Skipping email send.");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Drybros!</h1>
        </div>
        <div class="content">
          <p>Dear ${driverName},</p>
          <p>Welcome to the Drybros platform! Your driver account has been successfully created.</p>
          
          <h3>📱 Mobile App Login Credentials</h3>
          <div class="credentials">
            <p><strong>Driver Code:</strong> ${driverCode}</p>
            <p><strong>Password:</strong> ${appPassword}</p>
          </div>

          <h3>💻 Web Portal Login Credentials</h3>
          <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${webPassword}</p>
          </div>

          <p style="text-align: center;">
            <a href="${webLoginLink}" class="button">Login to Web Portal</a>
          </p>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p>Please change your password immediately after your first login for security purposes. Do not share your credentials with anyone.</p>
          </div>

          <p>If you have any questions or need assistance, please contact our support team.</p>
          <p>Best regards,<br>The Drybros Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to Drybros!

Dear ${driverName},

Welcome to the Drybros platform! Your driver account has been successfully created.

Mobile App Login Credentials:
- Driver Code: ${driverCode}
- Password: ${appPassword}

Web Portal Login Credentials:
- Email: ${email}
- Password: ${webPassword}

Web Login Link: ${webLoginLink}

⚠️ Security Notice:
Please change your password immediately after your first login for security purposes. Do not share your credentials with anyone.

If you have any questions or need assistance, please contact our support team.

Best regards,
The Drybros Team

---
This is an automated message. Please do not reply to this email.
  `;

  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: email,
      subject: "Welcome to Drybros - Your Driver Account Credentials",
      text: textContent,
      html: htmlContent,
    });

    logger.info("Driver welcome email sent successfully", { email, driverCode });
  } catch (error) {
    logger.error("Failed to send driver welcome email", { error, email, driverCode });
    // Don't throw error - email failure shouldn't break driver creation
  }
}
