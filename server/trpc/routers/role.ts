import { protectedProcedure, router } from "~~/server/trpc/trpc";

export const roleRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.enhancedPrisma.role.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });
  }),
});
