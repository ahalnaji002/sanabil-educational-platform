import "dotenv/config";
import { AdminRole, Grade, PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { parseEnv } from "../src/config/env.js";
const config = parseEnv(process.env);
const db = new PrismaClient();

const seedSubjects = [
  { name: "الرياضيات", slug: "mathematics", grade: Grade.TAWJIHI },
  { name: "الفيزياء", slug: "physics", grade: Grade.TAWJIHI },
  { name: "الكيمياء", slug: "chemistry", grade: Grade.TAWJIHI },
  { name: "اللغة العربية", slug: "arabic", grade: Grade.TAWJIHI },
  { name: "اللغة الإنجليزية", slug: "english", grade: Grade.TAWJIHI },
  { name: "الرياضيات - عاشر", slug: "tenth-mathematics", grade: Grade.TENTH },
  { name: "الرياضيات - حادي عشر", slug: "eleventh-mathematics", grade: Grade.ELEVENTH },
] as const;

try {
  const passwordHash = await bcrypt.hash(config.SEED_ADMIN_PASSWORD, 12);
  await db.admin.upsert({
    where: { email: config.SEED_ADMIN_EMAIL },
    update: { name: config.SEED_ADMIN_NAME, passwordHash, role: AdminRole.SUPER_ADMIN, isActive: true },
    create: { name: config.SEED_ADMIN_NAME, email: config.SEED_ADMIN_EMAIL, passwordHash, role: AdminRole.SUPER_ADMIN },
  });

  await Promise.all(seedSubjects.map((subject) => db.subject.upsert({
    where: { slug: subject.slug },
    update: { name: subject.name, grade: subject.grade, isActive: true },
    create: { ...subject, isActive: true },
  })));

  console.log(`Seed completed: super admin and ${String(seedSubjects.length)} subjects`);
} finally {
  await db.$disconnect();
}
