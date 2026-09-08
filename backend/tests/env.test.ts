import { describe, expect, it } from "vitest";
import { parseEnv } from "../src/config/env.js";
const valid = {
  NODE_ENV: "test", PORT: "4000", DATABASE_URL: "mysql://test",
  JWT_SECRET: "a-strong-test-key-with-more-than-32-characters",
  FRONTEND_ORIGIN: "http://localhost:3000", SEED_ADMIN_NAME: "Admin",
  SEED_ADMIN_EMAIL: "ADMIN@example.com", SEED_ADMIN_PASSWORD: "Password1",
};
describe("environment validation", () => {
  it("normalizes values and applies defaults", () => {
    const config = parseEnv(valid);
    expect(config.SEED_ADMIN_EMAIL).toBe("admin@example.com");
    expect(config.AUTH_COOKIE_NAME).toBe("sanabil_admin_session");
    expect(config.jwtMaxAgeMs).toBe(3_600_000);
  });
  it("fails for missing or weak required configuration", () => {
    expect(() => parseEnv({ ...valid, JWT_SECRET: "replace_me" })).toThrow("Invalid environment configuration");
    expect(() => parseEnv({})).toThrow("Invalid environment configuration");
  });
});
