import { AdminRole } from "@prisma/client";
import bcrypt from "bcrypt";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import { authorizeRoles } from "../src/middlewares/authorize-roles.js";
import type { AdminRepository } from "../src/modules/auth/auth.repository.js";
import type { AdminRecord } from "../src/modules/auth/auth.types.js";
import { errorHandler } from "../src/middlewares/error-handler.js";

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
  admin = { id: 1, name: "مدير", email: "admin@example.com", passwordHash: await bcrypt.hash("Password1", 4), role: AdminRole.SUPER_ADMIN, isActive: true };
});
const repository = (record: AdminRecord | null = admin): AdminRepository => ({
  findByEmail: (email) => Promise.resolve(record?.email === email ? record : null),
  findById: (id) => Promise.resolve(record?.id === id ? record : null),
});

describe("admin authentication", () => {
  it("logs in, sets an HttpOnly cookie, omits the token, and serves /me", async () => {
    const agent = request.agent(createApp(config, repository()));
    const login = await agent.post("/api/auth/login").send({ email: "ADMIN@example.com", password: "Password1" });
    expect(login.status).toBe(200);
    expect(login.headers["set-cookie"]?.[0]).toContain("HttpOnly");
    expect(JSON.stringify(login.body)).not.toContain("token");
    expect((login.body as { data: { admin: object } }).data.admin).not.toHaveProperty("passwordHash");
    expect((await agent.get("/api/auth/me")).status).toBe(200);
  });
  it.each([
    ["wrong password", repository(), "WrongPassword1"],
    ["unknown email", repository(null), "Password1"],
    ["inactive admin", repository({ ...admin, isActive: false }), "Password1"],
  ])("rejects %s generically", async (_label, repo, password) => {
    const response = await request(createApp(config, repo)).post("/api/auth/login").send({ email: "admin@example.com", password });
    expect(response.status).toBe(401);
    expect((response.body as { message: string }).message).toBe("Invalid email or password");
  });
  it("rejects missing and invalid authentication", async () => {
    const app = createApp(config, repository());
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    expect((await request(app).get("/api/auth/me").set("Cookie", "sanabil_admin_session=invalid")).status).toBe(401);
    const expired = jwt.sign({ role: "SUPER_ADMIN" }, config.JWT_SECRET, { subject: "1", expiresIn: -1 });
    expect((await request(app).get("/api/auth/me").set("Cookie", `sanabil_admin_session=${expired}`)).status).toBe(401);
  });
  it("clears the cookie on logout", async () => {
    const response = await request(createApp(config, repository())).post("/api/auth/logout");
    expect(response.headers["set-cookie"]?.[0]).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});

describe("security and errors", () => {
  it("allows and rejects roles", async () => {
    const app = express();
    app.get("/allowed", (req, _res, next) => { req.admin = { id: 1, name: "A", email: "a@b.com", role: AdminRole.SUPER_ADMIN }; next(); }, authorizeRoles(AdminRole.SUPER_ADMIN), (_req, res) => res.sendStatus(204));
    app.get("/denied", (req, _res, next) => { req.admin = { id: 2, name: "A", email: "a@b.com", role: AdminRole.ADMIN }; next(); }, authorizeRoles(AdminRole.SUPER_ADMIN), (_req, res) => res.sendStatus(204));
    app.use(errorHandler);
    expect((await request(app).get("/allowed")).status).toBe(204);
    expect((await request(app).get("/denied")).status).toBe(403);
  });
  it("standardizes malformed JSON and unknown routes", async () => {
    const app = createApp(config, repository());
    const malformed = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{");
    expect(malformed.body).toEqual({ success: false, message: "Malformed JSON" });
    expect((await request(app).get("/missing")).body).toEqual({ success: false, message: "Route not found" });
  });
});
