import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "~~/server/trpc/trpc";

export const userRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    if (ctx.session) {
      return {
        id: ctx.session.user.id,
        username: ctx.session.user.username,
        fullname: ctx.session.user.fullname,
        email: ctx.session.user.email,
        roles: ctx.session.user.roles.map((role) => role.role.name),
        permissions: ctx.session.user.roles.flatMap((role) => {
          return role.role.permissions.map((permission) => permission.permission.name);
        }),
      };
    }

    return null;
  }),
  get: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.enhancedPrisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          username: true,
          fullname: true,
          email: true,
          roles: { select: { role: { select: { name: true } } } },
        },
      });
    }),
  set: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        username: z.string().min(1).optional(),
        fullname: z.string().min(1).optional(),
        email: z.string().regex(/.+@.+/).min(1).optional(),
        roles: z.array(z.string().min(1)).min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.enhancedPrisma.$transaction(async (tx) => {
        return tx.user.update({
          where: { id: input.id },
          select: {
            id: true,
            username: true,
            fullname: true,
            email: true,
            roles: { select: { role: { select: { name: true } } } },
          },
          data: {
            username: input.username,
            fullname: input.fullname,
            email: input.email,
            roles: {
              deleteMany: {},
              createMany: input.roles
                ? {
                    data: (
                      await tx.role.findMany({
                        where: { name: { in: input.roles } },
                        select: { id: true },
                      })
                    ).map(({ id }) => ({ roleId: id })),
                    skipDuplicates: true,
                  }
                : undefined,
            },
          },
        });
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.enhancedPrisma.user.delete({
        where: { id: input.id },
        select: {
          id: true,
          username: true,
          fullname: true,
          email: true,
          roles: { select: { role: { select: { name: true } } } },
        },
      });
    }),
  search: protectedProcedure
    .input(
      z
        .object({
          cursor: z.string().uuid().optional(),
          limit: z.number().min(1).max(100).optional(),
          searchBy: z.enum(["username", "fullname", "email", "roles"]).optional(),
          search: z.union([z.string(), z.array(z.string())]).optional(),
          orderBy: z.enum(["username", "fullname", "email"]).optional(),
          order: z.enum(["asc", "desc"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input = {} }) => {
      const { cursor, limit = 20, searchBy = "username", search, orderBy = "username", order = "asc" } = input;

      let where: Prisma.UserWhereInput = {};
      if (search && search.length > 0) {
        const a = Array.isArray(search) ? search : [search];
        if (searchBy === "roles") {
          where = {
            roles: { some: { role: { name: { in: a, mode: "insensitive" } } } },
          };
        } else {
          where = {
            OR: a.map((s) => ({
              [searchBy]: { contains: s, mode: "insensitive" },
            })),
          };
        }
      }

      const users = await ctx.enhancedPrisma.user.findMany({
        select: {
          id: true,
          username: true,
          fullname: true,
          email: true,
          roles: { select: { role: { select: { name: true } } } },
        },
        where,
        orderBy: [{ [orderBy]: order }, { id: order }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | undefined = undefined;
      if (users.length > limit) {
        nextCursor = users[limit]!.id;
        users.pop();
      }

      return { users, nextCursor };
    }),
});
