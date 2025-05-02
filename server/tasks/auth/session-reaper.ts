import { defineTask } from "nitropack/runtime/task";

import { logger } from "~~/server/utils/logger";
import { prisma } from "~~/server/utils/prisma";

export default defineTask({
  meta: {
    description: "Reap expired sessions",
  },
  run: async () => {
    const { count } = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    logger.info(`Reaped ${count} expired sessions`);
    return { result: count };
  },
});
