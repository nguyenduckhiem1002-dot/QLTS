import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const configuredMode = process.env.QLTS_DEMO_MODE?.trim().toLowerCase();
const hasDatabase = Boolean(process.env.DATABASE_URL);
const production = process.env.VERCEL_ENV === "production";

const shouldUseDatabase =
  configuredMode === "false" ||
  (configuredMode !== "true" && production && hasDatabase);

if (shouldUseDatabase) {
  if (!hasDatabase) {
    console.error(
      "QLTS_DEMO_MODE=false requires DATABASE_URL, but DATABASE_URL is missing.",
    );
    process.exit(1);
  }

  console.log("Applying Prisma migrations for Vercel database deployment...");
  run("pnpm", ["db:deploy"]);
} else {
  console.log("Skipping database migration for read-only Vercel preview.");
}

run("pnpm", ["build"]);
