import type { H3Event } from "h3";

import type { LuciaSession } from "~~/server/utils/lucia";
import { enhance } from "~~/prisma/generated/zenstack/enhance";
import { prisma } from "~~/server/utils/prisma";

export const createContext = async (event: H3Event) => {
  const session = event.context.session as LuciaSession | null;

  return {
    session,
    enhancedPrisma: enhance(prisma, { user: session?.user }),
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
