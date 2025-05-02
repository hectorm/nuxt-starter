import type { Logger } from "pino";
import { useRuntimeConfig } from "nitropack/runtime/config";
import pino from "pino";

const config = useRuntimeConfig();

export const logger: Logger = pino({
  level: config.logLevel,
  transport: import.meta.dev ? { target: "pino-pretty", options: { colorize: true } } : undefined,
});
