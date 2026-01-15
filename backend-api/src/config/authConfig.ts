export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-prod",
  jwtExpiresIn: "8h",
  refreshTokenExpiresIn: "7d",
};
