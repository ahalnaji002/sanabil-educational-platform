import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().min(1).max(65_535),
  DATABASE_URL: z.string().trim().min(1),
  JWT_SECRET: z.string().min(32).refine((v) => !/(change|replace|placeholder|example|your[_-]?secret)/i.test(v)),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/).default("1h"),
  AUTH_COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_-]+$/).default("sanabil_admin_session"),
  FRONTEND_ORIGIN: z.url().refine((v) => ["http:", "https:"].includes(new URL(v).protocol)),
  COOKIE_SAME_SITE: z.enum(["lax", "strict"]).default("lax"),
  SEED_ADMIN_NAME: z.string().trim().min(1).max(120),
  SEED_ADMIN_EMAIL: z.email().transform((v) => v.trim().toLowerCase()),
  SEED_ADMIN_PASSWORD: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/),
});
export type AppConfig = z.infer<typeof envSchema> & { jwtMaxAgeMs: number };
const durationMs = (value: string) => {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error("Invalid JWT expiry");
  const units = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return Number(match[1]) * units[match[2] as keyof typeof units];
};
export const parseEnv = (source: NodeJS.ProcessEnv): AppConfig => {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid environment configuration: ${fields}`);
  }
  return { ...result.data, jwtMaxAgeMs: durationMs(result.data.JWT_EXPIRES_IN) };
};
