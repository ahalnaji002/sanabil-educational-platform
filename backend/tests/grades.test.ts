import { AdminRole } from "@prisma/client";
import bcrypt from "bcrypt";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import type { AdminRepository } from "../src/modules/auth/auth.repository.js";
import type { AdminRecord } from "../src/modules/auth/auth.types.js";
import type { GradeRepository } from "../src/modules/grades/grade.repository.js";
import type { GradeOrderItem, GradeRecord, GradeWriteInput, PublicGrade } from "../src/modules/grades/grade.types.js";
type GradeListBody = { data: { grades: GradeRecord[] } };
type GradeDetailBody = { data: { grade: GradeRecord } };
type PublicGradeListBody = { data: { grades: PublicGrade[] } };

const config: AppConfig = { NODE_ENV: "test", PORT: 4000, DATABASE_URL: "mysql://test", JWT_SECRET: "a-strong-test-key-with-more-than-32-characters", JWT_EXPIRES_IN: "1h", AUTH_COOKIE_NAME: "sanabil_admin_session", FRONTEND_ORIGIN: "http://localhost:3000", COOKIE_SAME_SITE: "lax", SEED_ADMIN_NAME: "Admin", SEED_ADMIN_EMAIL: "admin@example.com", SEED_ADMIN_PASSWORD: "Password1", jwtMaxAgeMs: 3_600_000 };
const date = new Date("2026-09-12T00:00:00.000Z");
let admin: AdminRecord;
beforeAll(async () => { admin = { id: 1, name: "مدير", email: "admin@example.com", passwordHash: await bcrypt.hash("Password1", 4), role: AdminRole.ADMIN, isActive: true }; });
const adminRepository: AdminRepository = { findByEmail: (email) => Promise.resolve(email === admin.email ? admin : null), findById: (id) => Promise.resolve(id === admin.id ? admin : null) };
const grade = (overrides: Partial<GradeRecord> = {}): GradeRecord => ({ id: 1, name: "توجيهي", slug: "tawjihi", sortOrder: 3, isActive: true, createdAt: date, updatedAt: date, subjectCount: 7, ...overrides });
class MemoryGradeRepository implements GradeRepository {
  constructor(public grades: GradeRecord[]) {}
  findMany(isActive?: boolean) { return Promise.resolve(this.grades.filter((item) => isActive === undefined || item.isActive === isActive).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)); }
  findById(id: number) { return Promise.resolve(this.grades.find((item) => item.id === id) ?? null); }
  findBySlug(slug: string) { return Promise.resolve(this.grades.find((item) => item.slug === slug) ?? null); }
  findMaxSortOrder() { return Promise.resolve(this.grades.length ? Math.max(...this.grades.map(({ sortOrder }) => sortOrder)) : null); }
  create(data: GradeWriteInput) { const value = grade({ ...data, id: Math.max(0, ...this.grades.map(({ id }) => id)) + 1, subjectCount: 0 }); this.grades.push(value); return Promise.resolve(value); }
  update(id: number, data: GradeWriteInput) { const current = this.grades.find((item) => item.id === id); if (!current) throw new Error("Grade missing in test repository"); const value = { ...current, ...data }; this.grades = this.grades.map((item) => item.id === id ? value : item); return Promise.resolve(value); }
  updateStatus(id: number, isActive: boolean) { const current = this.grades.find((item) => item.id === id); if (!current) throw new Error("Grade missing in test repository"); return this.update(id, { name: current.name, slug: current.slug, sortOrder: current.sortOrder, isActive }); }
  findByIds(ids: number[]) { return Promise.resolve(this.grades.filter((item) => ids.includes(item.id))); }
  reorder(items: GradeOrderItem[]) { this.grades = this.grades.map((item) => ({ ...item, sortOrder: items.find(({ id }) => id === item.id)?.sortOrder ?? item.sortOrder })); return Promise.resolve(); }
  findPublic(): Promise<PublicGrade[]> { return Promise.resolve(this.grades.filter(({ isActive }) => isActive).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id).map(({ id, name, slug, sortOrder }) => ({ id, name, slug, sortOrder }))); }
}
let repository: MemoryGradeRepository;
beforeEach(() => { repository = new MemoryGradeRepository([grade({ id: 1, name: "عاشر", slug: "tenth", sortOrder: 1, subjectCount: 2 }), grade({ id: 2, name: "حادي عشر", slug: "eleventh", sortOrder: 2, isActive: false, subjectCount: 1 }), grade({ id: 3 })]); });
const app = () => createApp(config, adminRepository, undefined, undefined, repository);
async function agent() { const value = request.agent(app()); await value.post("/api/auth/login").send({ email: admin.email, password: "Password1" }).expect(200); return value; }

describe("admin Grade API", () => {
  it("requires authentication", async () => { await request(app()).get("/api/admin/grades").expect(401); });
  it("lists by status with subjectCount in stable order", async () => { const response = await (await agent()).get("/api/admin/grades?status=all").expect(200); expect((response.body as GradeListBody).data.grades.map((item) => [item.slug, item.subjectCount])).toEqual([["tenth", 2], ["eleventh", 1], ["tawjihi", 7]]); });
  it("creates with normalized slug and predictable ordering", async () => { const response = await (await agent()).post("/api/admin/grades").send({ name: " تاسع ", slug: "Ninth" }).expect(201); expect((response.body as GradeDetailBody).data.grade).toMatchObject({ name: "تاسع", slug: "ninth", sortOrder: 4, isActive: true }); });
  it("rejects duplicate and invalid slugs", async () => { const client = await agent(); await client.post("/api/admin/grades").send({ name: "مكرر", slug: "TAWJIHI" }).expect(409); await client.post("/api/admin/grades").send({ name: "خطأ", slug: "not valid" }).expect(400); });
  it("updates all editable fields and validates IDs", async () => { const client = await agent(); const response = await client.put("/api/admin/grades/1").send({ name: "عاشر جديد", slug: "new-tenth", sortOrder: 9, isActive: false }).expect(200); expect((response.body as GradeDetailBody).data.grade).toMatchObject({ slug: "new-tenth", sortOrder: 9, isActive: false }); await client.get("/api/admin/grades/0").expect(400); await client.get("/api/admin/grades/99").expect(404); });
  it("activates and deactivates without deleting", async () => { const client = await agent(); await client.patch("/api/admin/grades/1/status").send({ isActive: false }).expect(200); await client.patch("/api/admin/grades/1/status").send({ isActive: true }).expect(200); expect(repository.grades).toHaveLength(3); expect(repository.grades[0]?.isActive).toBe(true); });
  it("reorders atomically-shaped input and rejects missing IDs", async () => { const client = await agent(); await client.patch("/api/admin/grades/reorder").send({ items: [{ id: 3, sortOrder: 1 }, { id: 1, sortOrder: 2 }] }).expect(200); expect((await repository.findMany()).slice(0, 2).map(({ id }) => id)).toEqual([3, 1]); await client.patch("/api/admin/grades/reorder").send({ items: [{ id: 99, sortOrder: 1 }] }).expect(400); });
});

describe("public Grade API", () => {
  it("returns active Grades only in stable order with safe fields", async () => { const response = await request(app()).get("/api/public/grades").expect(200); const publicGrades = (response.body as PublicGradeListBody).data.grades; expect(publicGrades).toEqual([{ id: 1, name: "عاشر", slug: "tenth", sortOrder: 1 }, { id: 3, name: "توجيهي", slug: "tawjihi", sortOrder: 3 }]); expect(publicGrades[0]).not.toHaveProperty("isActive"); });
});
