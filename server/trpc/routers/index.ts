import { roleRouter } from "~~/server/trpc/routers/role";
import { userRouter } from "~~/server/trpc/routers/user";
import { router } from "~~/server/trpc/trpc";

export const appRouter = router({
  role: roleRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
