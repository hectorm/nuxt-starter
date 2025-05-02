import { Prisma, PrismaClient } from "@prisma/client";

import { logger } from "~~/server/utils/logger";

export const prisma: PrismaClient<Prisma.PrismaClientOptions, "query" | "info" | "warn" | "error"> = new PrismaClient({
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
