import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Read directly (not prisma's strict `env()`) so `prisma generate` works
    // before a .env exists. The Prisma Client adapter reads this at runtime.
    url: process.env.DATABASE_URL ?? "",
  },
});
