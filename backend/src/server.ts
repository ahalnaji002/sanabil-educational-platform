import "dotenv/config";
import { createApp } from "./app.js";
import { parseEnv } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { PrismaAdminRepository } from "./modules/auth/auth.repository.js";
import { PrismaSubjectRepository } from "./modules/subjects/subject.repository.js";
import { PrismaDriveLinkRepository } from "./modules/drive-links/drive-link.repository.js";
import { PrismaGradeRepository } from "./modules/grades/grade.repository.js";

const config = parseEnv(process.env);
const app = createApp(
  config,
  new PrismaAdminRepository(prisma),
  new PrismaSubjectRepository(prisma),
  new PrismaDriveLinkRepository(prisma),
  new PrismaGradeRepository(prisma),
);

app.listen(config.PORT, () => {
  console.log(`Sanabil API listening on port ${String(config.PORT)}`);
});
