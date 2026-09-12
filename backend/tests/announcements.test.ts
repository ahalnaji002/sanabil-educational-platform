import { AdminRole } from "@prisma/client";
import bcrypt from "bcrypt";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import type { AdminRepository } from "../src/modules/auth/auth.repository.js";
import type { AdminRecord } from "../src/modules/auth/auth.types.js";
import type { AnnouncementRepository, AnnouncementRepositoryFilters } from "../src/modules/announcements/announcement.repository.js";
import type { AnnouncementOrderItem, AnnouncementRecord, AnnouncementWriteInput, PublicAnnouncement } from "../src/modules/announcements/announcement.types.js";

const config: AppConfig = { NODE_ENV: "test", PORT: 4000, DATABASE_URL: "mysql://test", JWT_SECRET: "a-strong-test-key-with-more-than-32-characters", JWT_EXPIRES_IN: "1h", AUTH_COOKIE_NAME: "sanabil_admin_session", FRONTEND_ORIGIN: "http://localhost:3000", COOKIE_SAME_SITE: "lax", SEED_ADMIN_NAME: "Admin", SEED_ADMIN_EMAIL: "admin@example.com", SEED_ADMIN_PASSWORD: "Password1", jwtMaxAgeMs: 3_600_000 };
const now = new Date("2026-09-12T12:00:00.000Z"); let admin: AdminRecord;
beforeAll(async () => { admin = { id: 1, name: "مدير", email: "admin@example.com", passwordHash: await bcrypt.hash("Password1", 4), role: AdminRole.ADMIN, isActive: true }; });
const admins: AdminRepository = { findByEmail: (email) => Promise.resolve(email === admin.email ? admin : null), findById: (id) => Promise.resolve(id === admin.id ? admin : null) };
const make = (value: Partial<AnnouncementRecord> = {}): AnnouncementRecord => ({ id: 1, title: "إعلان", content: "محتوى", badge: null, imageUrl: null, ctaLabel: null, ctaUrl: null, sortOrder: 1, isActive: true, startsAt: null, endsAt: null, createdAt: now, updatedAt: now, ...value });
class MemoryAnnouncements implements AnnouncementRepository {
  constructor(public items: AnnouncementRecord[]) {}
  findMany(filters: AnnouncementRepositoryFilters) { const current = filters.now.getTime(); return Promise.resolve(this.items.filter((item) => filters.isActive === undefined || item.isActive === filters.isActive).filter((item) => filters.visibility === "scheduled" ? !!item.startsAt && item.startsAt.getTime() > current : filters.visibility === "expired" ? !!item.endsAt && item.endsAt.getTime() < current : filters.visibility === "current" ? (!item.startsAt || item.startsAt.getTime() <= current) && (!item.endsAt || item.endsAt.getTime() >= current) : true).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)); }
  findById(id: number) { return Promise.resolve(this.items.find((item) => item.id === id) ?? null); }
  findByIds(ids: number[]) { return Promise.resolve(this.items.filter(({ id }) => ids.includes(id))); }
  findMaxSortOrder() { return Promise.resolve(this.items.length ? Math.max(...this.items.map(({ sortOrder }) => sortOrder)) : null); }
  create(data: AnnouncementWriteInput) { const item = make({ ...data, id: Math.max(0, ...this.items.map(({ id }) => id)) + 1 }); this.items.push(item); return Promise.resolve(item); }
  update(id: number, data: AnnouncementWriteInput) { const item = make({ ...this.items.find((value) => value.id === id), ...data, id }); this.items = this.items.map((value) => value.id === id ? item : value); return Promise.resolve(item); }
  updateStatus(id: number, isActive: boolean) { const item = this.items.find((value) => value.id === id); if (!item) throw new Error("Announcement missing in test repository"); return this.update(id, { ...item, isActive }); }
  reorder(items: AnnouncementOrderItem[]) { this.items = this.items.map((item) => ({ ...item, sortOrder: items.find(({ id }) => id === item.id)?.sortOrder ?? item.sortOrder })); return Promise.resolve(); }
  findPublic(at: Date): Promise<PublicAnnouncement[]> { return Promise.resolve(this.items.filter((item) => item.isActive && (!item.startsAt || item.startsAt <= at) && (!item.endsAt || item.endsAt >= at)).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id).map(({ id, title, content, badge, imageUrl, ctaLabel, ctaUrl, sortOrder }) => ({ id, title, content, badge, imageUrl, ctaLabel, ctaUrl, sortOrder }))); }
}
let repository: MemoryAnnouncements;
beforeEach(() => { repository = new MemoryAnnouncements([make(), make({ id: 2, title: "مستقبلي", sortOrder: 2, startsAt: new Date(Date.now() + 86_400_000) }), make({ id: 3, title: "منتهي", sortOrder: 3, endsAt: new Date("2020-01-01") }), make({ id: 4, title: "معطل", sortOrder: 4, isActive: false })]); });
const app = () => createApp(config, admins, undefined, undefined, undefined, repository);
async function agent() { const client = request.agent(app()); await client.post("/api/auth/login").send({ email: admin.email, password: "Password1" }).expect(200); return client; }
describe("Announcement APIs", () => {
  it("requires admin authentication", async () => { await request(app()).get("/api/admin/announcements").expect(401); });
  it("creates, updates, changes status, and rejects invalid CTA/scheduling", async () => { const client = await agent(); const created = await client.post("/api/admin/announcements").send({ title: " جديد ", content: " نص ", ctaLabel: null, ctaUrl: null, sortOrder: 5, isActive: true, startsAt: null, endsAt: null }).expect(201); const body = created.body as { data: { announcement: AnnouncementRecord } }; const id = body.data.announcement.id; expect(body.data.announcement.title).toBe("جديد"); await client.put(`/api/admin/announcements/${String(id)}`).send({ title: "معدل", content: "نص", badge: null, ctaLabel: "افتح", ctaUrl: "https://example.com", sortOrder: 1, isActive: true, startsAt: null, endsAt: null }).expect(200); await client.patch(`/api/admin/announcements/${String(id)}/status`).send({ isActive: false }).expect(200); await client.post("/api/admin/announcements").send({ title: "x", content: "x", ctaUrl: "http://bad.test" }).expect(400); await client.post("/api/admin/announcements").send({ title: "x", content: "x", startsAt: "2026-09-13T00:00:00.000Z", endsAt: "2026-09-12T00:00:00.000Z" }).expect(400); });
  it("uploads an optional image and removes it during editing", async () => {
    const client = await agent();
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const created = await client.post("/api/admin/announcements").field("title", "إعلان مصور").field("content", "محتوى").field("ctaLabel", "اضغط للتفاصيل").field("ctaUrl", "https://example.com").field("sortOrder", "5").field("isActive", "true").field("removeImage", "false").attach("image", png, { filename: "announcement.png", contentType: "image/png" }).expect(201);
    const item = (created.body as { data: { announcement: AnnouncementRecord } }).data.announcement;
    expect(item.imageUrl).toMatch(/^\/uploads\/announcements\/[\w-]+\.png$/);
    expect(item.ctaLabel).toBe("اضغط للتفاصيل");
    const updated = await client.put(`/api/admin/announcements/${String(item.id)}`).field("title", item.title).field("content", item.content).field("sortOrder", "5").field("isActive", "true").field("removeImage", "true").expect(200);
    expect((updated.body as { data: { announcement: AnnouncementRecord } }).data.announcement.imageUrl).toBeNull();
  });
  it("rejects unsupported announcement image files", async () => { const client = await agent(); await client.post("/api/admin/announcements").field("title", "ملف").field("content", "محتوى").attach("image", Buffer.from("not an image"), { filename: "file.txt", contentType: "text/plain" }).expect(400); });
  it("reorders with unique existing IDs", async () => { const client = await agent(); await client.patch("/api/admin/announcements/reorder").send({ items: [{ id: 2, sortOrder: 1 }, { id: 1, sortOrder: 2 }] }).expect(200); expect((await repository.findMany({ now, visibility: "all" })).slice(0, 2).map(({ id }) => id)).toEqual([2, 1]); await client.patch("/api/admin/announcements/reorder").send({ items: [{ id: 99, sortOrder: 1 }] }).expect(400); });
  it("returns only active announcements inside their schedule with safe ordered fields", async () => { const response = await request(app()).get("/api/public/announcements").expect(200); const body = response.body as { data: { announcements: PublicAnnouncement[] } }; const items = body.data.announcements; expect(items).toHaveLength(1); expect(items[0]).toMatchObject({ id: 1, title: "إعلان" }); expect(items[0]).not.toHaveProperty("isActive"); expect(items[0]).not.toHaveProperty("startsAt"); });
});
