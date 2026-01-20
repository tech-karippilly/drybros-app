// src/config/prismaClient.ts
import { PrismaClient } from "@prisma/client";
import config from "./appConfig";
import logger from "./logger";

// Optimized Prisma Client with connection pooling and error handling
const prisma = new PrismaClient({
  log:
    config.nodeEnv === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  errorFormat: "pretty",
});

// Handle Prisma connection lifecycle
prisma.$on("error" as never, (e: unknown) => {
  logger.error("Prisma Client Error", { error: e });
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
