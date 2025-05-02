import { createTRPCNuxtHandler } from "trpc-nuxt/server";

import { createContext } from "~~/server/trpc/context";
import { appRouter } from "~~/server/trpc/routers";

export default createTRPCNuxtHandler({
  router: appRouter,
  createContext,
});
