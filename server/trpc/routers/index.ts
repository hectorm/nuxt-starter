import { groupRouter } from "~~/server/trpc/routers/group";
import { roleRouter } from "~~/server/trpc/routers/role";
import { userRouter } from "~~/server/trpc/routers/user";
import { router } from "~~/server/trpc/trpc";

export const appRouter = router({
  user: userRouter,
  group: groupRouter,
  role: roleRouter,
});

export type AppRouter = typeof appRouter;
