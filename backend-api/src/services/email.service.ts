// src/services/email.service.ts
import { transporter, emailConfig } from "../config/emailConfig";

interface SendWelcomeEmailParams {
  to: string;
  name: string;
  loginLink: string;
}

/**
 * Send welcome email to newly registered admin
 */
export async function sendWelcomeEmail({ to, name, loginLink }: SendWelcomeEmailParams): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to Drybros!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Welcome to the Drybros platform! Your admin account has been successfully created.</p>
          <p>You can now access your admin dashboard using the link below:</p>
          <p style="text-align: center;">
            <a href="${loginLink}" class="button">Login to Dashboard</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4CAF50;">${loginLink}</p>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Drybros Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Drybros. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
    Welcome to Drybros!
    
    Hello ${name},
    
    Welcome to the Drybros platform! Your admin account has been successfully created.
    
    You can now access your admin dashboard using this link:
    ${loginLink}
    
    If you have any questions or need assistance, please don't hesitate to contact our support team.
    
    Best regards,
    The Drybros Team
    
    ---
    This is an automated email. Please do not reply to this message.
  `;

  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: to,
      subject: "Welcome to Drybros - Admin Account Created",
      text: textContent,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    // Don't throw error - registration should succeed even if email fails
    // Log the error for monitoring
  }
}

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetLink: string;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({ to, name, resetLink }: SendPasswordResetEmailParams): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #FF9800;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #FF9800;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>We received a request to reset your password for your Drybros account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #FF9800;">${resetLink}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </div>
          <p>Best regards,<br>The Drybros Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Drybros. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
    Password Reset Request
    
    Hello ${name},
    
    We received a request to reset your password for your Drybros account.
    
    Click the link below to reset your password:
    ${resetLink}
    
    ⚠️ Security Notice: This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
    
    Best regards,
    The Drybros Team
    
    ---
    This is an automated email. Please do not reply to this message.
  `;

  // Check if email config is properly set up
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    const error = new Error("Email configuration is missing. Please set SMTP_USER and SMTP_PASSWORD environment variables.");
    console.error("Email configuration error:", error.message);
    throw error;
  }

  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: to,
      subject: "Drybros - Password Reset Request",
      text: textContent,
      html: htmlContent,
    });
    console.log("Password reset email sent successfully to:", to);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    // Log detailed error information
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error; // Throw error so caller knows email failed
  }
}

interface SendStaffWelcomeEmailParams {
  to: string;
  name: string;
  email: string;
  password: string;
  loginLink: string;
}

/**
 * Send welcome email to newly created staff member with login credentials
 */
export async function sendStaffWelcomeEmail({
  to,
  name,
  email,
  password,
  loginLink,
}: SendStaffWelcomeEmailParams): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2196F3;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .credentials {
            background-color: #e3f2fd;
            border: 2px solid #2196F3;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-item {
            margin: 10px 0;
            padding: 10px;
            background-color: white;
            border-radius: 3px;
            border-left: 4px solid #2196F3;
          }
          .credential-label {
            font-weight: bold;
            color: #1976D2;
            margin-bottom: 5px;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #333;
            word-break: break-all;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to Drybros!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Welcome to the Drybros platform! Your staff account has been successfully created.</p>
          
          <div class="credentials">
            <h3 style="margin-top: 0; color: #1976D2;">Your Login Credentials</h3>
            <div class="credential-item">
              <div class="credential-label">Email:</div>
              <div class="credential-value">${email}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Password:</div>
              <div class="credential-value">${password}</div>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Important:</strong> Please keep these credentials secure and change your password after your first login for security purposes.
          </div>

          <p>You can now access your account using the link below:</p>
          <p style="text-align: center;">
            <a href="${loginLink}" class="button">Login to Dashboard</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2196F3;">${loginLink}</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Drybros Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Drybros. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
    Welcome to Drybros!
    
    Hello ${name},
    
    Welcome to the Drybros platform! Your staff account has been successfully created.
    
    Your Login Credentials:
    ======================
    Email: ${email}
    Password: ${password}
    
    ⚠️ Important: Please keep these credentials secure and change your password after your first login for security purposes.
    
    You can now access your account using this link:
    ${loginLink}
    
    If you have any questions or need assistance, please don't hesitate to contact our support team.
    
    Best regards,
    The Drybros Team
    
    ---
    This is an automated email. Please do not reply to this message.
  `;

  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: to,
      subject: "Welcome to Drybros - Staff Account Created",
      text: textContent,
      html: htmlContent,
    });
    console.log("Staff welcome email sent successfully to:", to);
  } catch (error) {
    console.error("Failed to send staff welcome email:", error);
    // Log detailed error information
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error; // Throw error so caller knows email failed
  }
}

interface SendPasswordResetConfirmationEmailParams {
  to: string;
  name: string;
  loginLink: string;
}

/**
 * Send password reset confirmation email
 */
export async function sendPasswordResetConfirmationEmail({ to, name, loginLink }: SendPasswordResetConfirmationEmailParams): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .info {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #0c5460;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Password Reset Successful</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Your password has been successfully reset.</p>
          <div class="info">
            <strong>ℹ️ Important:</strong> If you did not make this change, please contact our support team immediately.
          </div>
          <p>You can now login with your new password:</p>
          <p style="text-align: center;">
            <a href="${loginLink}" class="button">Login to Dashboard</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4CAF50;">${loginLink}</p>
          <p>Best regards,<br>The Drybros Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Drybros. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
    Password Reset Successful
    
    Hello ${name},
    
    Your password has been successfully reset.
    
    ℹ️ Important: If you did not make this change, please contact our support team immediately.
    
    You can now login with your new password:
    ${loginLink}
    
    Best regards,
    The Drybros Team
    
    ---
    This is an automated email. Please do not reply to this message.
  `;

  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: to,
      subject: "Drybros - Password Reset Successful",
      text: textContent,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Failed to send password reset confirmation email:", error);
    // Don't throw error - password reset should succeed even if email fails
  }
}
