import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";

const dotenvPath = path.join(__dirname, "..", "..", ".env");
require("dotenv").config({ path: dotenvPath });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun ./seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
