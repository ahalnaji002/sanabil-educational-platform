import { AdminRole } from "@prisma/client";
import bcrypt from "bcrypt";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import type { AdminRepository } from "../src/modules/auth/auth.repository.js";
import type { AdminRecord } from "../src/modules/auth/auth.types.js";
import type { DashboardRepository } from "../src/modules/dashboard/dashboard.repository.js";
import type { ProfileRepository } from "../src/modules/profile/profile.repository.js";
const config: AppConfig = { NODE_ENV: "test", PORT: 4000, DATABASE_URL: "mysql://test", JWT_SECRET: "a-strong-test-key-with-more-than-32-characters", JWT_EXPIRES_IN: "1h", AUTH_COOKIE_NAME: "sanabil_admin_session", FRONTEND_ORIGIN: "http://localhost:3000", COOKIE_SAME_SITE: "lax", SEED_ADMIN_NAME: "Admin", SEED_ADMIN_EMAIL: "admin@example.com", SEED_ADMIN_PASSWORD: "Password1", jwtMaxAgeMs: 3_600_000 };
let admin: AdminRecord; let second: AdminRecord;
const admins: AdminRepository = { findByEmail: (email) => Promise.resolve([admin, second].find((item) => item.email === email) ?? null), findById: (id) => Promise.resolve([admin, second].find((item) => item.id === id) ?? null) };
const profiles: ProfileRepository = { findByEmail: (email) => admins.findByEmail(email), findById: (id) => admins.findById(id), updateProfile: (id, data) => { admin = { ...admin, ...data }; return Promise.resolve(admin); }, updatePassword: (id, passwordHash) => { admin = { ...admin, passwordHash }; return Promise.resolve(); } };
const dashboard: DashboardRepository = { getSummary: () => Promise.resolve({ activeGrades: 3, activeSubjects: 10, activeDriveLinks: 8, activeAnnouncements: 2 }) };
beforeEach(async () => { admin = { id: 1, name: "مدير", email: "admin@example.com", passwordHash: await bcrypt.hash("Password1", 4), role: AdminRole.ADMIN, isActive: true }; second = { ...admin, id: 2, email: "used@example.com" }; });
const app = () => createApp(config, admins, undefined, undefined, undefined, undefined, profiles, dashboard);
async function agent() { const client = request.agent(app()); await client.post("/api/auth/login").send({ email: admin.email, password: "Password1" }).expect(200); return client; }
describe("profile and dashboard APIs", () => {
  it("updates normalized profile and /me resolves the new data", async () => { const client = await agent(); await client.put("/api/admin/profile").send({ name: " مدير جديد ", email: "NEW@example.com" }).expect(200); const me = await client.get("/api/auth/me").expect(200); const body = me.body as { data: { admin: object } }; expect(body.data.admin).toMatchObject({ name: "مدير جديد", email: "new@example.com" }); expect(body.data.admin).not.toHaveProperty("passwordHash"); });
  it("rejects duplicate email", async () => { await (await agent()).put("/api/admin/profile").send({ name: "مدير", email: "used@example.com" }).expect(409); });
  it("requires current password and strong confirmation, then changes password while preserving the session", async () => { const client = await agent(); await client.put("/api/admin/profile/password").send({ currentPassword: "wrong", newPassword: "NewPassword2", passwordConfirmation: "NewPassword2" }).expect(400); await client.put("/api/admin/profile/password").send({ currentPassword: "Password1", newPassword: "weak", passwordConfirmation: "weak" }).expect(400); await client.put("/api/admin/profile/password").send({ currentPassword: "Password1", newPassword: "NewPassword2", passwordConfirmation: "NewPassword2" }).expect(200); expect(await bcrypt.compare("NewPassword2", admin.passwordHash)).toBe(true); await client.get("/api/auth/me").expect(200); });
  it("protects and returns real dashboard summary shape", async () => { await request(app()).get("/api/admin/dashboard/summary").expect(401); const response = await (await agent()).get("/api/admin/dashboard/summary").expect(200); const body = response.body as { data: object }; expect(body.data).toEqual({ activeGrades: 3, activeSubjects: 10, activeDriveLinks: 8, activeAnnouncements: 2 }); });
});
