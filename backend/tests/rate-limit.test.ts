import { AdminRole } from "@prisma/client";
import bcrypt from "bcrypt";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import type { AdminRepository } from "../src/modules/auth/auth.repository.js";
import type { AdminRecord } from "../src/modules/auth/auth.types.js";
import { GENERAL_API_RATE_LIMIT_MAX, LOGIN_RATE_LIMIT_MAX } from "../src/middlewares/rate-limiters.js";

const config: AppConfig = {
  NODE_ENV: "test", PORT: 4000, DATABASE_URL: "mysql://test",
  JWT_SECRET: "a-strong-test-key-with-more-than-32-characters",
  JWT_EXPIRES_IN: "1h", AUTH_COOKIE_NAME: "sanabil_admin_session",
  FRONTEND_ORIGIN: "http://localhost:3000", COOKIE_SAME_SITE: "lax",
  SEED_ADMIN_NAME: "Admin", SEED_ADMIN_EMAIL: "admin@example.com",
  SEED_ADMIN_PASSWORD: "Password1", jwtMaxAgeMs: 3_600_000,
};

let admin: AdminRecord;
beforeAll(async () => {
  admin = { id: 1, name: "مدير", email: "admin@example.com", passwordHash: await bcrypt.hash("Password1", 4), role: AdminRole.ADMIN, isActive: true };
});

const repository: AdminRepository = {
  findByEmail: (email) => Promise.resolve(email === admin.email ? admin : null),
  findById: (id) => Promise.resolve(id === admin.id ? admin : null),
};

describe("rate limiting", () => {
  it("trusts exactly one reverse proxy hop", () => {
    expect(createApp(config, repository).get("trust proxy")).toBe(1);
  });

  it("allows a normal login below the limit and does not penalize successful logins", async () => {
    const app = createApp(config, repository);
    for (let attempt = 0; attempt < LOGIN_RATE_LIMIT_MAX + 1; attempt += 1) {
      await request(app).post("/api/auth/login").send({ email: admin.email, password: "Password1" }).expect(200);
    }
  });

  it("returns a generic 429 after repeated failed login attempts", async () => {
    const app = createApp(config, repository);
    for (let attempt = 0; attempt < LOGIN_RATE_LIMIT_MAX; attempt += 1) {
      await request(app).post("/api/auth/login").set("X-Forwarded-For", "203.0.113.10").send({ email: admin.email, password: "WrongPassword1" }).expect(401);
    }
    const limited = await request(app).post("/api/auth/login").set("X-Forwarded-For", "198.51.100.99, 203.0.113.10").send({ email: admin.email, password: "WrongPassword1" }).expect(429);
    expect(limited.body).toEqual({ success: false, message: "Too many login attempts. Please try again later." });
    expect(limited.headers).toHaveProperty("ratelimit");
    expect(limited.headers).not.toHaveProperty("x-ratelimit-limit");
    await request(app).post("/api/auth/login").set("X-Forwarded-For", "203.0.113.11").send({ email: admin.email, password: "WrongPassword1" }).expect(401);
  });

  it("limits general API traffic while leaving health monitoring reachable", async () => {
    const app = createApp(config, repository);
    for (let requestNumber = 0; requestNumber < GENERAL_API_RATE_LIMIT_MAX; requestNumber += 1) {
      await request(app).get("/api/unknown").expect(404);
    }
    const limited = await request(app).get("/api/unknown").expect(429);
    expect(limited.body).toEqual({ success: false, message: "Too many requests. Please try again later." });
    expect(limited.headers).toHaveProperty("ratelimit");
    await request(app).get("/api/health").expect(200);
  });
});
