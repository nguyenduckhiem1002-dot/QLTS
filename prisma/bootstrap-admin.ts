import { loadEnvFile } from "node:process";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { hash } from "bcryptjs";

try {
  loadEnvFile(".env");
} catch {
  // Docker and production environments provide variables directly.
}

const prisma = new PrismaClient();

async function main() {
  if ((await prisma.user.count()) > 0) {
    console.log("QLTS users already exist; bootstrap admin skipped.");
    return;
  }

  const email = process.env.QLTS_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.QLTS_BOOTSTRAP_ADMIN_PASSWORD ?? "";
  const name = process.env.QLTS_BOOTSTRAP_ADMIN_NAME?.trim() || "Casla Admin";

  if (!email || !password) {
    console.log("Bootstrap admin not configured; set QLTS_BOOTSTRAP_ADMIN_EMAIL and QLTS_BOOTSTRAP_ADMIN_PASSWORD.");
    return;
  }

  if (password.length < 10 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Bootstrap admin password must be 10-72 UTF-8 bytes.");
  }

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hash(password, 12),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
    },
  });

  console.log("Initial Casla Assets administrator created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
