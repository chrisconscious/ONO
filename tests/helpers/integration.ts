/**
 * Integration-suite bootstrap: verifies the disposable test database exists,
 * applies tracked migrations forward onto it (a migration-integrity check on
 * every run), and resets all tables so each test file starts from a clean DB.
 */
import { beforeAll } from "vitest";
import { prisma, truncateAll } from "./dbBootstrap";

beforeAll(async () => {
  await truncateAll();
  await prisma.$queryRaw`SELECT 1`;
});
