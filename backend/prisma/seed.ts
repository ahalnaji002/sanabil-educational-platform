import "dotenv/config";
import { AdminRole, PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { parseEnv } from "../src/config/env.js";
const config = parseEnv(process.env); const db = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash(config.SEED_ADMIN_PASSWORD, 12);
  await db.admin.upsert({
    where: { email: config.SEED_ADMIN_EMAIL },
    update: { name: config.SEED_ADMIN_NAME, passwordHash, role: AdminRole.SUPER_ADMIN, isActive: true },
    create: { name: config.SEED_ADMIN_NAME, email: config.SEED_ADMIN_EMAIL, passwordHash, role: AdminRole.SUPER_ADMIN },
  });
  console.log("Super admin seed completed");
} finally { await db.$disconnect(); }
