#!/usr/bin/env tsx
import type { Logger } from "pino";
import pino from "pino";

import { Permissions } from "~/domain/permissions";
import { Roles } from "~/domain/roles";
import { RolesPermissions } from "~/domain/roles-permissions";
import { Prisma, PrismaClient } from "~~/prisma/generated/prisma/client";

const isCLI = import.meta.url.endsWith("seed.ts");
const env = import.meta.env ?? process.env;

const logger: Logger = pino({
  level: env.NUXT_LOG_LEVEL ?? "info",
  transport: import.meta.dev ? { target: "pino-pretty", options: { colorize: true } } : undefined,
});

export const seed = async (prisma: PrismaClient) => {
  await prisma.$transaction((tx) => createRolesAndPermissions(tx as PrismaClient));
  if (env.PRISMA_LOAD_SAMPLE_DATA?.toLowerCase() === "true") {
    await prisma.$transaction((tx) => createSampleData(tx as PrismaClient));
  }
};

async function createRolesAndPermissions(prisma: PrismaClient) {
  await prisma.permission.createMany({
    data: Object.values(Permissions).map((name) => ({ name })),
    skipDuplicates: true,
  });

  await prisma.role.createMany({
    data: Object.values(Roles).map((name) => ({ name })),
    skipDuplicates: true,
  });

  for (const pair of Object.entries(RolesPermissions)) {
    const [role, permissions] = pair as [string, string[]];

    const [oldPermissions, newPermissions] = await Promise.all([
      prisma.permission.findMany({
        where: { roles: { some: { role: { name: role } } } },
        select: { id: true, name: true },
      }),
      prisma.permission.findMany({
        where: { name: { in: permissions } },
        select: { id: true, name: true },
      }),
    ]);

    const oldPermissionIds = new Set(oldPermissions.map((permission) => permission.id));
    const newPermissionIds = new Set(newPermissions.map((permission) => permission.id));

    const permissionsToRemove = oldPermissions.filter((permission) => !newPermissionIds.has(permission.id));
    const permissionsToAdd = newPermissions.filter((permission) => !oldPermissionIds.has(permission.id));

    if (logger.isLevelEnabled("debug")) {
      if (permissionsToRemove.length > 0) {
        const permissionsToRemoveNames = permissionsToRemove.map(({ name }) => name);
        logger.debug(`Removing permissions from role ${role}: ${permissionsToRemoveNames.join(", ")}`);
      }
      if (permissionsToAdd.length > 0) {
        const permissionsToAddNames = permissionsToAdd.map(({ name }) => name);
        logger.debug(`Adding permissions to role ${role}: ${permissionsToAddNames.join(", ")}`);
      }
    }

    if (permissionsToRemove.length > 0 || permissionsToAdd.length > 0) {
      await prisma.role.update({
        where: { name: role },
        select: { id: true },
        data: {
          permissions: {
            deleteMany: permissionsToRemove.map(({ id }) => ({ permissionId: id })),
            createMany: { data: permissionsToAdd.map(({ id }) => ({ permissionId: id })) },
          },
        },
      });
    }
  }
}

async function createSampleData(prisma: PrismaClient) {
  const uuid = (() => {
    let seed = 0;
    return (prefix: number): string => {
      const p = prefix.toString().padStart(4, "0");
      const s = (seed++).toString().padStart(8, "0");
      return `00000000-0000-7000-8000-${p}${s}`;
    };
  })();

  const users: Omit<Prisma.UserCreateInput, "seed">[] = [
    {
      id: uuid(0),
      username: "alice",
      fullname: "Alice Bennett",
      email: "alice@localhost",
      roles: {
        create: [{ role: { connect: { name: Roles.Admin } } }],
      },
    },
    {
      id: uuid(0),
      username: "bob",
      fullname: "Bob Collins",
      email: "bob@localhost",
      roles: {
        create: [{ role: { connect: { name: Roles.Admin } } }],
      },
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { ...user, roles: { deleteMany: { userId: user.id }, ...user.roles } },
      create: { ...user },
    });
  }
}

if (isCLI) {
  logger.info("Seeding database...");
  const prisma = new PrismaClient({
    transactionOptions: {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  });
  seed(prisma)
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      logger.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
