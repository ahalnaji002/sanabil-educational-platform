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
import type { DriveLinkRepository, RepositoryDriveLinkFilters } from "../src/modules/drive-links/drive-link.repository.js";
import type { DriveLinkOrderItem, DriveLinkRecord, DriveLinkWriteInput, PublicDriveLink } from "../src/modules/drive-links/drive-link.types.js";
import type { RepositorySubjectFilters, SubjectRepository } from "../src/modules/subjects/subject.repository.js";
import type { SubjectRecord, SubjectWriteInput } from "../src/modules/subjects/subject.types.js";

type DriveLinkListBody = { data: { driveLinks: DriveLinkRecord[] } };
type DriveLinkDetailBody = { data: { driveLink: DriveLinkRecord } };
type PublicDriveLinkListBody = { data: { subject: { grade: { id: number; name: string; slug: string } }; driveLinks: PublicDriveLink[] } };

function required<T>(value: T | undefined, message: string): T {
  if (!value) throw new Error(message);
  return value;
}

const config: AppConfig = {
  NODE_ENV: "test", PORT: 4000, DATABASE_URL: "mysql://test",
  JWT_SECRET: "a-strong-test-key-with-more-than-32-characters", JWT_EXPIRES_IN: "1h",
  AUTH_COOKIE_NAME: "sanabil_admin_session", FRONTEND_ORIGIN: "http://localhost:3000",
  COOKIE_SAME_SITE: "lax", SEED_ADMIN_NAME: "Admin", SEED_ADMIN_EMAIL: "admin@example.com",
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
  updateStatus(id: number, isActive: boolean) { const value = required(this.grades.find((item) => item.id === id), "Grade missing in test repository"); value.isActive = isActive; return Promise.resolve(value); }
  findByIds(ids: number[]) { return Promise.resolve(this.grades.filter(({ id }) => ids.includes(id))); }
  reorder(_items: GradeOrderItem[]) { return Promise.resolve(); }
  findPublic(): Promise<PublicGrade[]> { return Promise.resolve([]); }
}
const tenthGrade = grade({ id: 1, name: "عاشر", slug: "tenth", sortOrder: 1 });
const eleventhGrade = grade({ id: 2, name: "حادي عشر", slug: "eleventh", sortOrder: 2 });
const tawjihiGrade = grade();
const subject = (overrides: Partial<SubjectRecord> = {}): SubjectRecord => ({
  id: 1, name: "الرياضيات", slug: "mathematics", gradeId: 3, grade: tawjihiGrade,
  isActive: true, createdAt: date, updatedAt: date, ...overrides,
});
class MemorySubjectRepository implements SubjectRepository {
  constructor(public subjects: SubjectRecord[]) {}
  findMany(filters: RepositorySubjectFilters) { return Promise.resolve(this.subjects.filter((item) => filters.gradeId === undefined || item.gradeId === filters.gradeId).filter((item) => filters.isActive === undefined || item.isActive === filters.isActive)); }
  findById(id: number) { return Promise.resolve(this.subjects.find((item) => item.id === id) ?? null); }
  findBySlug(slug: string) { return Promise.resolve(this.subjects.find((item) => item.slug === slug) ?? null); }
  create(data: SubjectWriteInput) { const parent = required(grades.grades.find(({ id }) => id === data.gradeId), "Grade missing in test repository"); const value = subject({ ...data, grade: parent, id: this.subjects.length + 1 }); this.subjects.push(value); return Promise.resolve(value); }
  update(id: number, data: SubjectWriteInput) { const parent = required(grades.grades.find((item) => item.id === data.gradeId), "Grade missing in test repository"); const value = subject({ ...data, grade: parent, id }); this.subjects = this.subjects.map((item) => item.id === id ? value : item); return Promise.resolve(value); }
  deactivate(id: number) { const current = required(this.subjects.find((item) => item.id === id), "Subject missing in test repository"); return this.update(id, { name: current.name, slug: current.slug, gradeId: current.gradeId, isActive: false }); }
}

const link = (parent: SubjectRecord, overrides: Partial<DriveLinkRecord> = {}): DriveLinkRecord => ({
  id: 1, title: "الفرع العلمي", description: null, subjectId: parent.id,
  driveUrl: "https://drive.google.com/drive/folders/valid", sortOrder: 1, isActive: true,
  createdAt: date, updatedAt: date,
  subject: { id: parent.id, name: parent.name, slug: parent.slug, gradeId: parent.gradeId, grade: parent.grade, isActive: parent.isActive },
  ...overrides,
});
class MemoryDriveLinkRepository implements DriveLinkRepository {
  constructor(public links: DriveLinkRecord[]) {}
  findMany(filters: RepositoryDriveLinkFilters) { return Promise.resolve(this.links.filter((item) => filters.subjectId === undefined || item.subjectId === filters.subjectId).filter((item) => filters.isActive === undefined || item.isActive === filters.isActive).filter((item) => filters.gradeId === undefined || item.subject.gradeId === filters.gradeId).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)); }
  findById(id: number) { return Promise.resolve(this.links.find((item) => item.id === id) ?? null); }
  findByIds(ids: number[]) { return Promise.resolve(this.links.filter((item) => ids.includes(item.id))); }
  findMaxSortOrder(subjectId: number) { const orders = this.links.filter((item) => item.subjectId === subjectId).map(({ sortOrder }) => sortOrder); return Promise.resolve(orders.length ? Math.max(...orders) : null); }
  create(data: DriveLinkWriteInput) { const parent = required(subjects.subjects.find(({ id }) => id === data.subjectId), "Subject missing in test repository"); const value = link(parent, { ...data, id: Math.max(0, ...this.links.map(({ id }) => id)) + 1 }); this.links.push(value); return Promise.resolve(value); }
  update(id: number, data: DriveLinkWriteInput) { const parent = required(subjects.subjects.find((item) => item.id === data.subjectId), "Subject missing in test repository"); const current = required(this.links.find((item) => item.id === id), "Link missing in test repository"); const value = link(parent, { ...current, ...data, id, subject: { id: parent.id, name: parent.name, slug: parent.slug, gradeId: parent.gradeId, grade: parent.grade, isActive: parent.isActive } }); this.links = this.links.map((item) => item.id === id ? value : item); return Promise.resolve(value); }
  updateStatus(id: number, isActive: boolean) { const current = required(this.links.find((item) => item.id === id), "Link missing in test repository"); return this.update(id, { title: current.title, description: current.description, subjectId: current.subjectId, driveUrl: current.driveUrl, sortOrder: current.sortOrder, isActive }); }
  delete(id: number) { this.links = this.links.filter((item) => item.id !== id); return Promise.resolve(); }
  reorder(_subjectId: number, items: DriveLinkOrderItem[]) { this.links = this.links.map((item) => ({ ...item, sortOrder: items.find(({ id }) => id === item.id)?.sortOrder ?? item.sortOrder })); return Promise.resolve(); }
  findPublicBySubjectId(subjectId: number): Promise<PublicDriveLink[]> { return Promise.resolve(this.links.filter((item) => item.subjectId === subjectId && item.isActive).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id).map(({ id, title, description, driveUrl, sortOrder }) => ({ id, title, description, driveUrl, sortOrder }))); }
}

let subjects: MemorySubjectRepository;
let links: MemoryDriveLinkRepository;
let grades: MemoryGradeRepository;
beforeEach(() => {
  grades = new MemoryGradeRepository([{ ...tenthGrade }, { ...eleventhGrade }, { ...tawjihiGrade }]);
  const math = subject();
  const tenth = subject({ id: 2, name: "علوم", slug: "science", gradeId: 1, grade: tenthGrade });
  const inactiveSubject = subject({ id: 3, name: "مادة معطلة", slug: "inactive", gradeId: 2, grade: eleventhGrade, isActive: false });
  subjects = new MemorySubjectRepository([math, tenth, inactiveSubject]);
  links = new MemoryDriveLinkRepository([
    link(math, { id: 1, title: "ثانٍ", sortOrder: 2 }),
    link(math, { id: 2, title: "أول", sortOrder: 1 }),
    link(math, { id: 3, title: "معطل", sortOrder: 3, isActive: false }),
    link(tenth, { id: 4, title: "عاشر", subjectId: 2, sortOrder: 1 }),
    link(inactiveSubject, { id: 5, title: "مخفي", subjectId: 3, sortOrder: 1 }),
  ]);
});
const app = () => createApp(config, adminRepository, subjects, links, grades);
async function agent() { const value = request.agent(app()); await value.post("/api/auth/login").send({ email: admin.email, password: "Password1" }).expect(200); return value; }

describe("admin Drive Link API", () => {
  it("requires authentication", async () => { await request(app()).get("/api/admin/drive-links").expect(401); });
  it("lists deterministically and combines Subject, status, and grade filters", async () => {
    const response = await (await agent()).get("/api/admin/drive-links?subjectId=1&status=inactive&gradeId=3").expect(200);
    expect((response.body as DriveLinkListBody).data.driveLinks.map((item) => item.id)).toEqual([3]);
  });
  it("gets one active or inactive link and rejects invalid IDs", async () => {
    const client = await agent();
    await client.get("/api/admin/drive-links/3").expect(200);
    await client.get("/api/admin/drive-links/0").expect(400);
    await client.get("/api/admin/drive-links/999").expect(404);
  });
  it("creates a valid link after the highest order and rejects missing Subjects", async () => {
    const client = await agent();
    const response = await client.post("/api/admin/drive-links").send({ title: " مراجعات ", subjectId: 1, driveUrl: "https://drive.google.com/drive/folders/reviews" }).expect(201);
    expect((response.body as DriveLinkDetailBody).data.driveLink).toMatchObject({ title: "مراجعات", sortOrder: 4, isActive: true });
    await client.post("/api/admin/drive-links").send({ title: "خطأ", subjectId: 99, driveUrl: "https://drive.google.com/file/d/x" }).expect(400);
  });
  it("rejects malformed, insecure, unrelated, and lookalike URLs", async () => {
    const client = await agent();
    for (const driveUrl of ["not-a-url", "http://drive.google.com/file/d/x", "https://example.com/x", "https://drive.google.com.example.com/x"]) {
      await client.post("/api/admin/drive-links").send({ title: "خطأ", subjectId: 1, driveUrl }).expect(400);
    }
  });
  it("updates all editable fields", async () => {
    const response = await (await agent()).put("/api/admin/drive-links/1").send({ title: "محدث", description: "شرح", subjectId: 2, driveUrl: "https://drive.google.com/file/d/updated", sortOrder: 7, isActive: false }).expect(200);
    expect((response.body as DriveLinkDetailBody).data.driveLink).toMatchObject({ title: "محدث", subjectId: 2, sortOrder: 7, isActive: false });
  });
  it("activates and deactivates explicitly", async () => {
    const client = await agent();
    const inactive = await client.patch("/api/admin/drive-links/1/status").send({ isActive: false }).expect(200);
    expect((inactive.body as DriveLinkDetailBody).data.driveLink.isActive).toBe(false);
    const active = await client.patch("/api/admin/drive-links/1/status").send({ isActive: true }).expect(200);
    expect((active.body as DriveLinkDetailBody).data.driveLink.isActive).toBe(true);
  });
  it("permanently deletes only the selected link", async () => {
    const client = await agent();
    await client.delete("/api/admin/drive-links/1").expect(200);
    expect(links.links.some(({ id }) => id === 1)).toBe(false);
    expect(subjects.subjects).toHaveLength(3);
  });
  it("reorders and rejects links from another Subject", async () => {
    const client = await agent();
    await client.patch("/api/admin/drive-links/reorder").send({ subjectId: 1, items: [{ id: 1, sortOrder: 1 }, { id: 2, sortOrder: 2 }] }).expect(200);
    const reordered = await client.get("/api/admin/drive-links?subjectId=1").expect(200);
    expect((reordered.body as DriveLinkListBody).data.driveLinks.slice(0, 2).map((item) => item.id)).toEqual([1, 2]);
    await client.patch("/api/admin/drive-links/reorder").send({ subjectId: 1, items: [{ id: 1, sortOrder: 1 }, { id: 4, sortOrder: 2 }] }).expect(400);
  });
});

describe("public Drive Link API", () => {
  it("returns active links only, ordered, with safe fields", async () => {
    const response = await request(app()).get("/api/public/subjects/mathematics/drive-links").expect(200);
    const body = response.body as PublicDriveLinkListBody;
    expect(body.data.driveLinks.map((item) => item.id)).toEqual([2, 1]);
    expect(body.data.driveLinks[0]).toEqual({ id: 2, title: "أول", description: null, driveUrl: "https://drive.google.com/drive/folders/valid", sortOrder: 1 });
    expect(body.data.subject.grade).toEqual({ id: 3, name: "توجيهي", slug: "tawjihi" });
  });
  it("does not expose links for an inactive or missing Subject", async () => {
    await request(app()).get("/api/public/subjects/inactive/drive-links").expect(404);
    await request(app()).get("/api/public/subjects/missing/drive-links").expect(404);
  });
  it("does not expose links when the parent Grade is inactive", async () => {
    tawjihiGrade.isActive = false;
    required(subjects.subjects[0], "Subject missing in test repository").grade.isActive = false;
    await request(app()).get("/api/public/subjects/mathematics/drive-links").expect(404);
    tawjihiGrade.isActive = true;
  });
});
