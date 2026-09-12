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
import type { RepositorySubjectFilters, SubjectRepository } from "../src/modules/subjects/subject.repository.js";
import type { PublicSubject, SubjectRecord, SubjectWriteInput } from "../src/modules/subjects/subject.types.js";

type SubjectDetailBody = { data: { subject: SubjectRecord } };
type SubjectListBody = { data: { subjects: SubjectRecord[] } };
type PublicSubjectBody = { data: { subjects: PublicSubject[] } };
type ErrorBody = { errors: Record<string, string> };
function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

const config: AppConfig = {
  NODE_ENV: "test", PORT: 4000, DATABASE_URL: "mysql://test",
  JWT_SECRET: "a-strong-test-key-with-more-than-32-characters",
  JWT_EXPIRES_IN: "1h", AUTH_COOKIE_NAME: "sanabil_admin_session",
  FRONTEND_ORIGIN: "http://localhost:3000", COOKIE_SAME_SITE: "lax",
  SEED_ADMIN_NAME: "Admin", SEED_ADMIN_EMAIL: "admin@example.com",
  SEED_ADMIN_PASSWORD: "Password1", jwtMaxAgeMs: 3_600_000,
};
const date = new Date("2026-09-12T00:00:00.000Z");
let admin: AdminRecord;
beforeAll(async () => {
  admin = { id: 1, name: "مدير", email: "admin@example.com", passwordHash: await bcrypt.hash("Password1", 4), role: AdminRole.ADMIN, isActive: true };
});
const adminRepository: AdminRepository = {
  findByEmail: (email) => Promise.resolve(email === admin.email ? admin : null),
  findById: (id) => Promise.resolve(id === admin.id ? admin : null),
};

const grade = (overrides: Partial<GradeRecord> = {}): GradeRecord => ({
  id: 3, name: "توجيهي", slug: "tawjihi", sortOrder: 3, isActive: true,
  createdAt: date, updatedAt: date, subjectCount: 0, ...overrides,
});
class MemoryGradeRepository implements GradeRepository {
  constructor(public grades: GradeRecord[]) {}
  findMany(isActive?: boolean) { return Promise.resolve(this.grades.filter((item) => isActive === undefined || item.isActive === isActive)); }
  findById(id: number) { return Promise.resolve(this.grades.find((item) => item.id === id) ?? null); }
  findBySlug(slug: string) { return Promise.resolve(this.grades.find((item) => item.slug === slug) ?? null); }
  findMaxSortOrder() { return Promise.resolve(3); }
  create(data: GradeWriteInput) { return Promise.resolve(grade(data)); }
  update(id: number, data: GradeWriteInput) { return Promise.resolve(grade({ ...data, id })); }
  updateStatus(id: number, isActive: boolean) { const current = required(this.grades.find((item) => item.id === id), "Grade missing in test repository"); current.isActive = isActive; return Promise.resolve(current); }
  findByIds(ids: number[]) { return Promise.resolve(this.grades.filter(({ id }) => ids.includes(id))); }
  reorder(_items: GradeOrderItem[]) { return Promise.resolve(); }
  findPublic(): Promise<PublicGrade[]> { return Promise.resolve(this.grades.filter(({ isActive }) => isActive).map(({ id, name, slug, sortOrder }) => ({ id, name, slug, sortOrder }))); }
}

const tenth = grade({ id: 1, name: "عاشر", slug: "tenth", sortOrder: 1 });
const eleventh = grade({ id: 2, name: "حادي عشر", slug: "eleventh", sortOrder: 2, isActive: false });
const tawjihi = grade();
const subject = (overrides: Partial<SubjectRecord> = {}): SubjectRecord => ({
  id: 1, name: "الرياضيات", slug: "mathematics", gradeId: tawjihi.id,
  grade: tawjihi, isActive: true, createdAt: date, updatedAt: date, ...overrides,
});
class MemorySubjectRepository implements SubjectRepository {
  constructor(public subjects: SubjectRecord[]) {}
  findMany(filters: RepositorySubjectFilters) {
    return Promise.resolve(this.subjects
      .filter((item) => filters.gradeId === undefined || item.gradeId === filters.gradeId)
      .filter((item) => filters.isActive === undefined || item.isActive === filters.isActive)
      .sort((a, b) => a.grade.sortOrder - b.grade.sortOrder || a.name.localeCompare(b.name) || a.id - b.id));
  }
  findById(id: number) { return Promise.resolve(this.subjects.find((item) => item.id === id) ?? null); }
  findBySlug(slug: string) { return Promise.resolve(this.subjects.find((item) => item.slug === slug) ?? null); }
  create(data: SubjectWriteInput) {
    const parent = required(grades.grades.find(({ id }) => id === data.gradeId), "Grade missing in test repository");
    const created = subject({ ...data, grade: parent, id: Math.max(0, ...this.subjects.map(({ id }) => id)) + 1 });
    this.subjects.push(created);
    return Promise.resolve(created);
  }
  update(id: number, data: SubjectWriteInput) {
    const parent = required(grades.grades.find((item) => item.id === data.gradeId), "Grade missing in test repository");
    const updated = subject({ ...this.subjects.find((item) => item.id === id), ...data, id, grade: parent, updatedAt: date });
    this.subjects = this.subjects.map((item) => item.id === id ? updated : item);
    return Promise.resolve(updated);
  }
  deactivate(id: number) {
    const current = this.subjects.find((item) => item.id === id);
    if (!current) throw new Error("Subject not found in test repository");
    return this.update(id, { name: current.name, slug: current.slug, gradeId: current.gradeId, isActive: false });
  }
}

let grades: MemoryGradeRepository;
let subjects: MemorySubjectRepository;
beforeEach(() => {
  grades = new MemoryGradeRepository([{ ...tenth }, { ...eleventh }, { ...tawjihi }]);
  subjects = new MemorySubjectRepository([
    subject(),
    subject({ id: 2, name: "علوم", slug: "tenth-science", gradeId: tenth.id, grade: tenth }),
    subject({ id: 3, name: "مادة معطلة", slug: "inactive-subject", gradeId: eleventh.id, grade: eleventh, isActive: false }),
  ]);
});
const app = () => createApp(config, adminRepository, subjects, undefined, grades);
async function authenticatedAgent() {
  const agent = request.agent(app());
  await agent.post("/api/auth/login").send({ email: "admin@example.com", password: "Password1" }).expect(200);
  return agent;
}

describe("admin subject API", () => {
  it("requires admin authentication", async () => { await request(app()).get("/api/admin/subjects").expect(401); });
  it("creates a normalized subject and rejects a duplicate slug", async () => {
    const agent = await authenticatedAgent();
    const response = await agent.post("/api/admin/subjects").send({ name: "  الأحياء  ", slug: "Biology", gradeId: 3, isActive: true }).expect(201);
    expect((response.body as SubjectDetailBody).data.subject).toMatchObject({ name: "الأحياء", slug: "biology", gradeId: 3, grade: { slug: "tawjihi" }, isActive: true });
    const duplicate = await agent.post("/api/admin/subjects").send({ name: "أحياء أخرى", slug: "BIOLOGY", gradeId: 1, isActive: true }).expect(409);
    expect((duplicate.body as ErrorBody).errors).toEqual({ slug: "Slug is already in use" });
  });
  it("updates all editable subject fields", async () => {
    const response = await (await authenticatedAgent()).put("/api/admin/subjects/1").send({ name: "رياضيات جديدة", slug: "advanced-mathematics", gradeId: 2, isActive: false }).expect(200);
    expect((response.body as SubjectDetailBody).data.subject).toMatchObject({ id: 1, slug: "advanced-mathematics", gradeId: 2, grade: { slug: "eleventh" }, isActive: false });
  });
  it("rejects missing grades and invalid IDs", async () => {
    const agent = await authenticatedAgent();
    await agent.post("/api/admin/subjects").send({ name: "اختبار", slug: "test", gradeId: 99, isActive: true }).expect(400);
    await agent.get("/api/admin/subjects/0").expect(400);
  });
  it("filters deterministically by status and grade ID", async () => {
    const agent = await authenticatedAgent();
    expect(((await agent.get("/api/admin/subjects?status=all").expect(200)).body as SubjectListBody).data.subjects).toHaveLength(3);
    const inactive = await agent.get("/api/admin/subjects?status=inactive&gradeId=2").expect(200);
    expect((inactive.body as SubjectListBody).data.subjects.map(({ slug }) => slug)).toEqual(["inactive-subject"]);
  });
  it("deactivates without physically deleting and is idempotent", async () => {
    const agent = await authenticatedAgent();
    await agent.delete("/api/admin/subjects/1").expect(200);
    await agent.delete("/api/admin/subjects/1").expect(200);
    expect(subjects.subjects).toHaveLength(3);
    expect(subjects.subjects.find(({ id }) => id === 1)?.isActive).toBe(false);
  });
});

describe("public subject API", () => {
  it("returns only active subjects belonging to active grades with safe fields", async () => {
    const response = await request(app()).get("/api/public/subjects").expect(200);
    const items = (response.body as PublicSubjectBody).data.subjects;
    expect(items.map(({ slug }) => slug)).toEqual(["tenth-science", "mathematics"]);
    expect(items[0]).not.toHaveProperty("isActive");
    expect(items[0]).not.toHaveProperty("createdAt");
  });
  it("filters by dynamic grade slug and hides inactive grades", async () => {
    const response = await request(app()).get("/api/public/subjects?grade=tenth").expect(200);
    expect((response.body as PublicSubjectBody).data.subjects).toEqual([{ id: 2, name: "علوم", slug: "tenth-science", grade: { id: 1, name: "عاشر", slug: "tenth" } }]);
    await request(app()).get("/api/public/subjects?grade=eleventh").expect(404);
    await request(app()).get("/api/public/subjects?grade=missing").expect(404);
  });
});
