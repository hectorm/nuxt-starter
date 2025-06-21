import type { H3Event } from "h3";

import { enhance } from "~~/prisma/generated/zenstack/enhance";
import { prisma } from "~~/server/utils/prisma";

export const createContext = async (event: H3Event) => {
  return {
    session: event.context.session,
    enhancedPrisma: enhance(prisma, {
      user: event.context.session?.user ? { ...event.context.session.user } : undefined,
    }),
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
