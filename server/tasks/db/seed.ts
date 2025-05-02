import { defineTask } from "nitropack/runtime/task";

import { seed } from "~~/prisma/seed";
import { logger } from "~~/server/utils/logger";
import { prisma } from "~~/server/utils/prisma";

export default defineTask({
  meta: {
    description: "Run database seeding",
  },
  run: async () => {
    try {
      await seed(prisma);
      return { result: true };
    } catch (error) {
      logger.error(error, "Error during database seeding");
      return { result: false, error };
    }
  },
});
