import "dotenv/config";
import { AdminRole, PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { parseEnv } from "../src/config/env.js";
const config = parseEnv(process.env);
const db = new PrismaClient();

const seedGrades = [
  { name: "عاشر", slug: "tenth", sortOrder: 1 },
  { name: "حادي عشر", slug: "eleventh", sortOrder: 2 },
  { name: "توجيهي", slug: "tawjihi", sortOrder: 3 },
] as const;

const seedSubjects = [
  { name: "الرياضيات", slug: "mathematics", gradeSlug: "tawjihi" },
  { name: "الفيزياء", slug: "physics", gradeSlug: "tawjihi" },
  { name: "الكيمياء", slug: "chemistry", gradeSlug: "tawjihi" },
  { name: "اللغة العربية", slug: "arabic", gradeSlug: "tawjihi" },
  { name: "اللغة الإنجليزية", slug: "english", gradeSlug: "tawjihi" },
  { name: "أحياء", slug: "biology", gradeSlug: "tawjihi" },
  { name: "تكنولوجيا علمي", slug: "technology", gradeSlug: "tawjihi" },
  { name: "الرياضيات - عاشر", slug: "tenth-mathematics", gradeSlug: "tenth" },
  { name: "الرياضيات - حادي عشر", slug: "eleventh-mathematics", gradeSlug: "eleventh" },
] as const;

// These are the real, pre-existing student destinations formerly stored in the frontend.
const existingDriveLinks = [
  { subjectSlug: "mathematics", title: "الفرع العلمي", description: "الوصول إلى مجلد مواد الرياضيات للفرع العلمي.", driveUrl: "https://drive.google.com/drive/folders/1dJ20sK1leOwIqNEyRredG2_nvoAyWSpp", sortOrder: 1 },
  { subjectSlug: "mathematics", title: "الفرع الأدبي", description: "الوصول إلى مجلد مواد الرياضيات للفرع الأدبي.", driveUrl: "https://drive.google.com/drive/folders/1Tdl15mvbF6Se6f1nnu0dG_AD8S9IPi9_", sortOrder: 2 },
  { subjectSlug: "physics", title: "فتح المادة", description: "الوصول إلى مجلد الفيزياء المعتمد.", driveUrl: "https://drive.google.com/drive/folders/1MwnYVZu_Z5w3C3ERaQbe4-CU1aNseHlZ", sortOrder: 1 },
  { subjectSlug: "chemistry", title: "فتح المادة", description: "الوصول إلى مجلد الكيمياء المعتمد.", driveUrl: "https://drive.google.com/drive/folders/1Jp9mPKIhYXTQygy609Ago0bTt6lNu9WC", sortOrder: 1 },
  { subjectSlug: "arabic", title: "فتح المادة", description: "الوصول إلى مجلد اللغة العربية المعتمد.", driveUrl: "https://drive.google.com/drive/folders/1balI8n1zsb5UYfKY9JpjxyixIj7Fue_s", sortOrder: 1 },
  { subjectSlug: "english", title: "فتح المادة", description: "الوصول إلى مجلد اللغة الإنجليزية المعتمد.", driveUrl: "https://drive.google.com/drive/folders/1ctL8SH4MSuqZi3cFq66ckZSShtJTLx7m", sortOrder: 1 },
  { subjectSlug: "biology", title: "فتح المادة", description: "الوصول إلى مجلد الأحياء المعتمد.", driveUrl: "https://drive.google.com/drive/folders/1enC_4e_wSMM63KGK_vUUkIF_qpDW9Uea", sortOrder: 1 },
  { subjectSlug: "technology", title: "فتح المادة", description: "الوصول إلى مجلد تكنولوجيا علمي المعتمد.", driveUrl: "https://drive.google.com/drive/folders/14H3v5eK7JtObTqXcnmuM7jlNItzlGSKC", sortOrder: 1 },
] as const;

try {
  const passwordHash = await bcrypt.hash(config.SEED_ADMIN_PASSWORD, 12);
  await db.admin.upsert({
    where: { email: config.SEED_ADMIN_EMAIL },
    update: { name: config.SEED_ADMIN_NAME, passwordHash, role: AdminRole.SUPER_ADMIN, isActive: true },
    create: { name: config.SEED_ADMIN_NAME, email: config.SEED_ADMIN_EMAIL, passwordHash, role: AdminRole.SUPER_ADMIN },
  });

  const grades = await Promise.all(seedGrades.map((grade) => db.grade.upsert({
    where: { slug: grade.slug },
    update: { name: grade.name, sortOrder: grade.sortOrder, isActive: true },
    create: { ...grade, isActive: true },
  })));
  const gradeIds = new Map(grades.map((grade) => [grade.slug, grade.id]));

  await Promise.all(seedSubjects.map(({ gradeSlug, ...subject }) => {
    const gradeId = gradeIds.get(gradeSlug);
    if (!gradeId) throw new Error(`Seed Grade missing: ${gradeSlug}`);
    return db.subject.upsert({
      where: { slug: subject.slug },
      update: { name: subject.name, gradeId, isActive: true },
      create: { ...subject, gradeId, isActive: true },
    });
  }));

  for (const existingLink of existingDriveLinks) {
    const subject = await db.subject.findUniqueOrThrow({ where: { slug: existingLink.subjectSlug }, select: { id: true } });
    const alreadyStored = await db.driveLink.findFirst({ where: { subjectId: subject.id, driveUrl: existingLink.driveUrl }, select: { id: true } });
    if (!alreadyStored) {
      await db.driveLink.create({ data: {
        subjectId: subject.id,
        title: existingLink.title,
        description: existingLink.description,
        driveUrl: existingLink.driveUrl,
        sortOrder: existingLink.sortOrder,
        isActive: true,
      } });
    }
  }

  console.log(`Seed completed: super admin, ${String(seedGrades.length)} Grades, ${String(seedSubjects.length)} Subjects, and preserved Drive links`);
} finally {
  await db.$disconnect();
}
