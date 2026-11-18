import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env["DATABASE_URL"] ??
      (() => {
        throw new Error("DATABASE_URL must be set");
      })(),
  },
});
