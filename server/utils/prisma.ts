import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "~~/prisma/generated/prisma/client";
import { logger } from "~~/server/utils/logger";

export const adapter = new PrismaPg({ connectionString: process.env.PRISMA_DATABASE_URL });
export const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  },
  log: [
    { level: "query", emit: "event" },
    { level: "info", emit: "event" },
    { level: "warn", emit: "event" },
    { level: "error", emit: "event" },
  ],
  errorFormat: "pretty",
});

prisma.$on("query", (event) => {
  logger.trace(event, "Prisma query");
});

prisma.$on("info", (event) => {
  logger.info(event, "Prisma info");
});

prisma.$on("warn", (event) => {
  logger.warn(event, "Prisma warning");
});

prisma.$on("error", (event) => {
  logger.error(event, "Prisma error");
});
