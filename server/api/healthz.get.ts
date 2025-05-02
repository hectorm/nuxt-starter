import { createError, defineEventHandler } from "h3";

import { logger } from "~~/server/utils/logger";
import { prisma } from "~~/server/utils/prisma";

export default defineEventHandler(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    logger.error(error, "Database check error");
    throw createError({
      statusCode: 500,
    });
  }

  return { status: "OK" };
});
