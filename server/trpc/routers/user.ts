import type { Prisma } from "@prisma/client";
import { z } from "zod/v4";

import { protectedProcedure, publicProcedure, router } from "~~/server/trpc/trpc";

export const userRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    if (ctx.session) {
      const { user } = ctx.session;

      return {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        roles: user.roles.map(({ role }) => role.name),
        groups: user.groups.map(({ group }) => group.name),
        permissions: ([] as string[]).concat(
          user.roles.flatMap(({ role }) => {
            return role.permissions.map(({ permission }) => permission.name);
          }),
          user.groups.flatMap(({ group }) => {
            return group.roles.flatMap(({ role }) => {
              return role.permissions.map(({ permission }) => permission.name);
            });
          }),
        ),
      };
    }

    return null;
  }),
  read: protectedProcedure
    .input(
      z.object({
        id: z.uuidv7(),
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
          groups: { select: { group: { select: { name: true } } } },
        },
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        username: z.string().min(1),
        fullname: z.string().min(1),
        email: z.string().regex(/.+@.+/).min(1),
        roles: z.array(z.string().min(1)).optional(),
        groups: z.array(z.string().min(1)).optional(),
      }),
    )
    .mutation(() => {
      throw new Error("Not implemented");
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.uuidv7(),
        username: z.string().min(1).optional(),
        fullname: z.string().min(1).optional(),
        email: z.string().regex(/.+@.+/).min(1).optional(),
        roles: z.array(z.string().min(1)).optional(),
        groups: z.array(z.string().min(1)).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.enhancedPrisma.$transaction(async (tx) => {
        const data: Prisma.UserUpdateInput = {
          username: input.username,
          fullname: input.fullname,
          email: input.email,
        };

        if (input.roles) {
          const [oldRoles, newRoles] = await Promise.all([
            tx.role.findMany({
              where: { users: { some: { userId: input.id } } },
              select: { id: true, name: true },
            }),
            tx.role.findMany({
              where: { name: { in: input.roles } },
              select: { id: true, name: true },
            }),
          ]);

          const oldRoleIds = new Set(oldRoles.map((role) => role.id));
          const newRoleIds = new Set(newRoles.map((role) => role.id));

          const rolesToRemove = oldRoles.filter((role) => !newRoleIds.has(role.id));
          const rolesToAdd = newRoles.filter((role) => !oldRoleIds.has(role.id));

          data.roles = {
            deleteMany: { OR: rolesToRemove.map(({ id }) => ({ roleId: id })) },
            createMany: { data: rolesToAdd.map(({ id }) => ({ roleId: id })) },
          };
        }

        if (input.groups) {
          const [oldGroups, newGroups] = await Promise.all([
            tx.group.findMany({
              where: { users: { some: { userId: input.id } } },
              select: { id: true, name: true },
            }),
            tx.group.findMany({
              where: { name: { in: input.groups } },
              select: { id: true, name: true },
            }),
          ]);

          const oldGroupIds = new Set(oldGroups.map((role) => role.id));
          const newGroupIds = new Set(newGroups.map((role) => role.id));

          const groupsToRemove = oldGroups.filter((group) => !newGroupIds.has(group.id));
          const groupsToAdd = newGroups.filter((group) => !oldGroupIds.has(group.id));

          data.groups = {
            deleteMany: { OR: groupsToRemove.map(({ id }) => ({ groupId: id })) },
            createMany: { data: groupsToAdd.map(({ id }) => ({ groupId: id })) },
          };
        }

        return tx.user.update({
          where: { id: input.id },
          select: {
            id: true,
            username: true,
            fullname: true,
            email: true,
            roles: { select: { role: { select: { name: true } } } },
            groups: { select: { group: { select: { name: true } } } },
          },
          data,
        });
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.uuidv7(),
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
          groups: { select: { group: { select: { name: true } } } },
        },
      });
    }),
  search: protectedProcedure
    .input(
      z
        .object({
          cursor: z.uuidv7().optional(),
          limit: z.number().min(1).max(100).optional(),
          searchBy: z.enum(["username", "fullname", "email", "roles", "groups"]).optional(),
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
        const searchList = Array.isArray(search) ? search : [search];
        if (searchBy === "roles") {
          where = {
            roles: { some: { role: { name: { in: searchList, mode: "insensitive" } } } },
          };
        } else if (searchBy === "groups") {
          where = {
            groups: { some: { group: { name: { in: searchList, mode: "insensitive" } } } },
          };
        } else {
          where = {
            OR: searchList.map((value) => ({
              [searchBy]: { contains: value, mode: "insensitive" },
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
          groups: { select: { group: { select: { name: true } } } },
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
