import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { protectedProcedure, router } from "~~/server/trpc/trpc";

export const groupRouter = router({
  read: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.enhancedPrisma.group.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          description: true,
          roles: { select: { role: { select: { name: true } } } },
        },
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().nullish(),
        roles: z.array(z.string().min(1)).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.enhancedPrisma.$transaction(async (tx) => {
        const data: Prisma.GroupCreateInput = {
          name: input.name,
          description: input.description,
        };

        if (input.roles) {
          const roles = await tx.role.findMany({
            where: { name: { in: input.roles } },
            select: { id: true, name: true },
          });

          data.roles = {
            createMany: { data: roles.map(({ id }) => ({ roleId: id })) },
          };
        }

        return tx.group.create({
          select: {
            id: true,
            name: true,
            description: true,
            roles: { select: { role: { select: { name: true } } } },
          },
          data,
        });
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().nullish(),
        roles: z.array(z.string().min(1)).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.enhancedPrisma.$transaction(async (tx) => {
        const data: Prisma.GroupUpdateInput = {
          name: input.name,
          description: input.description,
        };

        if (input.roles) {
          const [oldRoles, newRoles] = await Promise.all([
            tx.role.findMany({
              where: { groups: { some: { groupId: input.id } } },
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

        return tx.group.update({
          where: { id: input.id },
          select: {
            id: true,
            name: true,
            description: true,
            roles: { select: { role: { select: { name: true } } } },
          },
          data,
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
      return ctx.enhancedPrisma.group.delete({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          description: true,
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
          searchBy: z.enum(["name", "roles"]).optional(),
          search: z.union([z.string(), z.array(z.string())]).optional(),
          orderBy: z.enum(["name"]).optional(),
          order: z.enum(["asc", "desc"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input = {} }) => {
      const { cursor, limit = 20, searchBy = "name", search, orderBy = "name", order = "asc" } = input;

      let where: Prisma.GroupWhereInput = {};
      if (search && search.length > 0) {
        const searchList = Array.isArray(search) ? search : [search];
        if (searchBy === "roles") {
          where = {
            roles: { some: { role: { name: { in: searchList, mode: "insensitive" } } } },
          };
        } else {
          where = {
            OR: searchList.map((value) => ({
              [searchBy]: { contains: value, mode: "insensitive" },
            })),
          };
        }
      }

      const groups = await ctx.enhancedPrisma.group.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          roles: { select: { role: { select: { name: true } } } },
        },
        where,
        orderBy: [{ [orderBy]: order }, { id: order }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | undefined = undefined;
      if (groups.length > limit) {
        nextCursor = groups[limit]!.id;
        groups.pop();
      }

      return { groups, nextCursor };
    }),
});
