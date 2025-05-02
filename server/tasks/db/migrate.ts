import path from "node:path";

import PrismaInternals from "@prisma/internals";
import PrismaMigrate from "@prisma/migrate";
import { defineTask } from "nitropack/runtime/task";

import { logger } from "~~/server/utils/logger";

export default defineTask({
  meta: {
    description: "Run database migrations",
  },
  // The following task uses Prisma's internal APIs to run migrations
  // TODO: replace with a more stable API when available
  // See: https://github.com/prisma/prisma/issues/13549
  run: async () => {
    let migrate;

    try {
      const schemaPathResult = await PrismaInternals.getSchemaWithPath();
      if (!schemaPathResult?.schemaPath) {
        logger.error("No schema found");
        return { result: false };
      }

      const migrationsDirPath = path.join(schemaPathResult.schemaRootDir, "migrations");
      const schemaContext = { schemaFiles: schemaPathResult.schemas } as PrismaInternals.SchemaContext;
      migrate = await PrismaMigrate.Migrate.setup({ migrationsDirPath, schemaContext });

      const { migrations } = await migrate.listMigrationDirectories();
      if (migrations.length > 0) {
        logger.info(`${migrations.length} migration(s) found`);
      } else {
        logger.info("No migration found");
      }

      const { appliedMigrationNames } = await migrate.applyMigrations();
      if (appliedMigrationNames.length > 0) {
        logger.info(`The following migration(s) have been applied: ${appliedMigrationNames.join(", ")}`);
      } else {
        logger.info("No pending migrations to apply");
      }

      return { result: true };
    } catch (error) {
      if (import.meta.dev && (error as { code?: string })?.code === "P3005") {
        // Ignore that the database schema is not empty during development.
      } else {
        logger.error(error, "Error during database migrations");
      }
      return { result: false, error };
    } finally {
      migrate?.stop();
    }
  },
});
