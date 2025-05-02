import type { NitroApp } from "nitropack";
import { defineNitroPlugin } from "nitropack/runtime/plugin";

import { logger } from "~~/server/utils/logger";

export default defineNitroPlugin((nitroApp: NitroApp): void => {
  nitroApp.hooks.hook("error", (error: unknown) => {
    logger.error(error, "Nitro error");
  });
});
