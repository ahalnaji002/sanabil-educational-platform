import type { Prisma, PrismaClient } from "@prisma/client";
import type { AnnouncementOrderItem, AnnouncementRecord, AnnouncementVisibility, AnnouncementWriteInput, PublicAnnouncement } from "./announcement.types.js";

export type AnnouncementRepositoryFilters = { isActive?: boolean; visibility?: AnnouncementVisibility; now: Date };
export interface AnnouncementRepository {
  findMany(filters: AnnouncementRepositoryFilters): Promise<AnnouncementRecord[]>;
  findById(id: number): Promise<AnnouncementRecord | null>;
  findByIds(ids: number[]): Promise<AnnouncementRecord[]>;
  findMaxSortOrder(): Promise<number | null>;
  create(data: AnnouncementWriteInput): Promise<AnnouncementRecord>;
  update(id: number, data: AnnouncementWriteInput): Promise<AnnouncementRecord>;
  updateStatus(id: number, isActive: boolean): Promise<AnnouncementRecord>;
  reorder(items: AnnouncementOrderItem[]): Promise<void>;
  findPublic(now: Date): Promise<PublicAnnouncement[]>;
}

const select = { id: true, title: true, content: true, badge: true, imageUrl: true, ctaLabel: true, ctaUrl: true, sortOrder: true, isActive: true, startsAt: true, endsAt: true, createdAt: true, updatedAt: true } satisfies Prisma.AnnouncementSelect;
const publicSelect = { id: true, title: true, content: true, badge: true, imageUrl: true, ctaLabel: true, ctaUrl: true, sortOrder: true } satisfies Prisma.AnnouncementSelect;
const currentWhere = (now: Date) => ({ AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] });

export class PrismaAnnouncementRepository implements AnnouncementRepository {
  constructor(private readonly db: PrismaClient) {}
  findMany(filters: AnnouncementRepositoryFilters) {
    const visibility = filters.visibility ?? "all";
    return this.db.announcement.findMany({
      where: {
        ...(filters.isActive === undefined ? {} : { isActive: filters.isActive }),
        ...(visibility === "current" ? currentWhere(filters.now) : {}),
        ...(visibility === "scheduled" ? { startsAt: { gt: filters.now } } : {}),
        ...(visibility === "expired" ? { endsAt: { lt: filters.now } } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select,
    });
  }
  findById(id: number) { return this.db.announcement.findUnique({ where: { id }, select }); }
  findByIds(ids: number[]) { return this.db.announcement.findMany({ where: { id: { in: ids } }, select }); }
  async findMaxSortOrder() { return (await this.db.announcement.aggregate({ _max: { sortOrder: true } }))._max.sortOrder; }
  create(data: AnnouncementWriteInput) { return this.db.announcement.create({ data, select }); }
  update(id: number, data: AnnouncementWriteInput) { return this.db.announcement.update({ where: { id }, data, select }); }
  updateStatus(id: number, isActive: boolean) { return this.db.announcement.update({ where: { id }, data: { isActive }, select }); }
  async reorder(items: AnnouncementOrderItem[]) {
    await this.db.$transaction(async (transaction) => {
      for (const item of items) {
        const result = await transaction.announcement.updateMany({ where: { id: item.id }, data: { sortOrder: item.sortOrder } });
        if (result.count !== 1) throw new Error("Announcement reorder membership changed");
      }
    });
  }
  findPublic(now: Date) { return this.db.announcement.findMany({ where: { isActive: true, ...currentWhere(now) }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: publicSelect }); }
}
