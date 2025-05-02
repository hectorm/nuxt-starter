import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { Context } from "~~/server/trpc/context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.enhancedPrisma) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: { ...ctx, session: ctx.session, enhancedPrisma: ctx.enhancedPrisma },
  });
});

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);
export const router = t.router;
export const middleware = t.middleware;
