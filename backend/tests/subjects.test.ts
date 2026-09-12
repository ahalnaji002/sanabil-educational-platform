import { AdminRole, Grade } from "@prisma/client";
import bcrypt from "bcrypt";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import type { AdminRepository } from "../src/modules/auth/auth.repository.js";
import type { AdminRecord } from "../src/modules/auth/auth.types.js";
import type { RepositorySubjectFilters, SubjectRepository } from "../src/modules/subjects/subject.repository.js";
import type { SubjectRecord, SubjectWriteInput } from "../src/modules/subjects/subject.types.js";

type SubjectDetailBody = { data: { subject: SubjectRecord } };
type SubjectListBody = { data: { subjects: SubjectRecord[] } };
type PublicSubjectBody = { data: { subjects: { id: number; name: string; slug: string; grade: Grade }[] } };
type ErrorBody = { errors: Record<string, string> };

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
  admin = {
    id: 1,
    name: "مدير",
    email: "admin@example.com",
    passwordHash: await bcrypt.hash("Password1", 4),
    role: AdminRole.ADMIN,
    isActive: true,
  };
});

const adminRepository: AdminRepository = {
  findByEmail: (email) => Promise.resolve(email === admin.email ? admin : null),
  findById: (id) => Promise.resolve(id === admin.id ? admin : null),
};

const date = new Date("2026-09-12T00:00:00.000Z");
const subject = (overrides: Partial<SubjectRecord> = {}): SubjectRecord => ({
  id: 1,
  name: "الرياضيات",
  slug: "mathematics",
  grade: Grade.TAWJIHI,
  isActive: true,
  createdAt: date,
  updatedAt: date,
  ...overrides,
});

class MemorySubjectRepository implements SubjectRepository {
  subjects: SubjectRecord[];

  constructor(subjects: SubjectRecord[] = []) {
    this.subjects = [...subjects];
  }

  findMany(filters: RepositorySubjectFilters) {
    return Promise.resolve(this.subjects
      .filter((item) => filters.grade === undefined || item.grade === filters.grade)
      .filter((item) => filters.isActive === undefined || item.isActive === filters.isActive)
      .sort((a, b) => a.grade.localeCompare(b.grade) || a.name.localeCompare(b.name) || a.id - b.id));
  }

  findById(id: number) {
    return Promise.resolve(this.subjects.find((item) => item.id === id) ?? null);
  }

  findBySlug(slug: string) {
    return Promise.resolve(this.subjects.find((item) => item.slug === slug) ?? null);
  }

  create(data: SubjectWriteInput) {
    const created = subject({ ...data, id: Math.max(0, ...this.subjects.map(({ id }) => id)) + 1 });
    this.subjects.push(created);
    return Promise.resolve(created);
  }

  update(id: number, data: SubjectWriteInput) {
    const index = this.subjects.findIndex((item) => item.id === id);
    const updated = subject({ ...this.subjects[index], ...data, id, updatedAt: date });
    this.subjects[index] = updated;
    return Promise.resolve(updated);
  }

  deactivate(id: number) {
    const current = this.subjects.find((item) => item.id === id);
    if (!current) throw new Error("Subject not found in test repository");
    return this.update(id, { name: current.name, slug: current.slug, grade: current.grade, isActive: false });
  }
}

let repository: MemorySubjectRepository;
beforeEach(() => {
  repository = new MemorySubjectRepository([
    subject(),
    subject({ id: 2, name: "علوم", slug: "tenth-science", grade: Grade.TENTH }),
    subject({ id: 3, name: "مادة معطلة", slug: "inactive-subject", grade: Grade.ELEVENTH, isActive: false }),
  ]);
});

async function authenticatedAgent() {
  const agent = request.agent(createApp(config, adminRepository, repository));
  await agent.post("/api/auth/login").send({ email: "admin@example.com", password: "Password1" }).expect(200);
  return agent;
}

describe("admin subject API", () => {
  it("requires admin authentication", async () => {
    await request(createApp(config, adminRepository, repository)).get("/api/admin/subjects").expect(401);
  });

  it("creates a normalized subject and rejects a duplicate slug", async () => {
    const agent = await authenticatedAgent();
    const response = await agent.post("/api/admin/subjects").send({
      name: "  الأحياء  ", slug: "Biology", grade: "TAWJIHI", isActive: true,
    }).expect(201);
    expect((response.body as SubjectDetailBody).data.subject).toMatchObject({ name: "الأحياء", slug: "biology", grade: "TAWJIHI", isActive: true });

    const duplicate = await agent.post("/api/admin/subjects").send({
      name: "أحياء أخرى", slug: "BIOLOGY", grade: "TENTH", isActive: true,
    }).expect(409);
    expect((duplicate.body as ErrorBody).errors).toEqual({ slug: "Slug is already in use" });
  });

  it("updates all editable subject fields", async () => {
    const agent = await authenticatedAgent();
    const response = await agent.put("/api/admin/subjects/1").send({
      name: "رياضيات جديدة", slug: "advanced-mathematics", grade: "ELEVENTH", isActive: false,
    }).expect(200);
    expect((response.body as SubjectDetailBody).data.subject).toMatchObject({ id: 1, slug: "advanced-mathematics", grade: "ELEVENTH", isActive: false });
  });

  it("rejects invalid grades and IDs", async () => {
    const agent = await authenticatedAgent();
    await agent.post("/api/admin/subjects").send({ name: "اختبار", slug: "test", grade: "NINTH", isActive: true }).expect(400);
    await agent.get("/api/admin/subjects/0").expect(400);
  });

  it("filters deterministically by status and grade", async () => {
    const agent = await authenticatedAgent();
    const all = await agent.get("/api/admin/subjects?status=all").expect(200);
    expect((all.body as SubjectListBody).data.subjects).toHaveLength(3);
    const inactive = await agent.get("/api/admin/subjects?status=inactive&grade=ELEVENTH").expect(200);
    const inactiveSubjects = (inactive.body as SubjectListBody).data.subjects;
    expect(inactiveSubjects).toHaveLength(1);
    expect(inactiveSubjects[0]?.slug).toBe("inactive-subject");
  });

  it("deactivates without physically deleting and is idempotent", async () => {
    const agent = await authenticatedAgent();
    await agent.delete("/api/admin/subjects/1").expect(200);
    await agent.delete("/api/admin/subjects/1").expect(200);
    expect(repository.subjects).toHaveLength(3);
    expect(repository.subjects.find(({ id }) => id === 1)?.isActive).toBe(false);
  });
});

describe("public subject API", () => {
  it("returns only active subjects and safe fields", async () => {
    const response = await request(createApp(config, adminRepository, repository)).get("/api/public/subjects").expect(200);
    const subjects = (response.body as PublicSubjectBody).data.subjects;
    expect(subjects).toHaveLength(2);
    expect(subjects[0]).not.toHaveProperty("isActive");
    expect(subjects[0]).not.toHaveProperty("createdAt");
  });

  it("filters active subjects by grade and rejects invalid grades", async () => {
    const app = createApp(config, adminRepository, repository);
    const response = await request(app).get("/api/public/subjects?grade=TENTH").expect(200);
    expect((response.body as PublicSubjectBody).data.subjects).toEqual([{ id: 2, name: "علوم", slug: "tenth-science", grade: "TENTH" }]);
    await request(app).get("/api/public/subjects?grade=NINTH").expect(400);
  });
});
