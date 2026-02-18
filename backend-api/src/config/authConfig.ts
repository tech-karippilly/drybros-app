export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-prod",
  jwtExpiresIn: "24h",
  refreshTokenExpiresIn: "8h",
  passwordResetTokenExpiresIn: "1h",
};
