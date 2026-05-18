import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env["DATABASE_URL"] || "postgresql://repondly_user:RepondlyAdmin2026@127.0.0.1:5433/repondly",
  },
});
