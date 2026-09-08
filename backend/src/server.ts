import "dotenv/config";
import { createApp } from "./app.js";
import { parseEnv } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { PrismaAdminRepository } from "./modules/auth/auth.repository.js";

const config = parseEnv(process.env);
const app = createApp(config, new PrismaAdminRepository(prisma));

app.listen(config.PORT, () => {
  console.log(`Sanabil API listening on port ${String(config.PORT)}`);
});
