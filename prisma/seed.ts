#!/usr/bin/env tsx
import type { Logger } from "pino";
import { Prisma, PrismaClient } from "@prisma/client";
import pino from "pino";

import { Permissions } from "~/domain/permissions";
import { Roles } from "~/domain/roles";
import { RolesPermissions } from "~/domain/roles-permissions";

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

    const existingPermissions = (
      await prisma.permissionsOnRoles.findMany({
        where: { role: { name: role } },
        select: { permission: { select: { name: true } } },
      })
    ).map(({ permission }) => permission.name);

    const permissionsToDelete = existingPermissions.filter((name) => !permissions.includes(name));
    if (permissionsToDelete.length > 0) {
      logger.debug(`Deleting permissions from role ${role}: ${permissionsToDelete.join(", ")}`);
      await prisma.permissionsOnRoles.deleteMany({
        where: {
          permission: { name: { in: permissionsToDelete } },
          role: { name: role },
        },
      });
    }

    const permissionsToCreate = permissions.filter((name) => !existingPermissions.includes(name));
    if (permissionsToCreate.length > 0) {
      logger.debug(`Adding permissions to role ${role}: ${permissionsToCreate.join(", ")}`);
      await prisma.role.update({
        where: { name: role },
        data: {
          permissions: {
            create: permissions.map((name) => ({
              permission: { connect: { name } },
            })),
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
      username: "admin",
      fullname: "Admin User",
      email: "admin@localhost",
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
