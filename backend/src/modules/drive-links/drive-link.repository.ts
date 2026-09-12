import type { Grade, Prisma, PrismaClient } from "@prisma/client";
import type { DriveLinkOrderItem, DriveLinkRecord, DriveLinkWriteInput, PublicDriveLink } from "./drive-link.types.js";

export type RepositoryDriveLinkFilters = {
  subjectId?: number;
  isActive?: boolean;
  grade?: Grade;
};

export interface DriveLinkRepository {
  findMany(filters: RepositoryDriveLinkFilters): Promise<DriveLinkRecord[]>;
  findById(id: number): Promise<DriveLinkRecord | null>;
  findByIds(ids: number[]): Promise<DriveLinkRecord[]>;
  findMaxSortOrder(subjectId: number): Promise<number | null>;
  create(data: DriveLinkWriteInput): Promise<DriveLinkRecord>;
  update(id: number, data: DriveLinkWriteInput): Promise<DriveLinkRecord>;
  updateStatus(id: number, isActive: boolean): Promise<DriveLinkRecord>;
  delete(id: number): Promise<void>;
  reorder(subjectId: number, items: DriveLinkOrderItem[]): Promise<void>;
  findPublicBySubjectId(subjectId: number): Promise<PublicDriveLink[]>;
}

const subjectSelect = { id: true, name: true, slug: true, grade: true, isActive: true } satisfies Prisma.SubjectSelect;
const driveLinkSelect = {
  id: true,
  title: true,
  description: true,
  subjectId: true,
  driveUrl: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  subject: { select: subjectSelect },
} satisfies Prisma.DriveLinkSelect;
const publicDriveLinkSelect = {
  id: true,
  title: true,
  description: true,
  driveUrl: true,
  sortOrder: true,
} satisfies Prisma.DriveLinkSelect;

export class PrismaDriveLinkRepository implements DriveLinkRepository {
  constructor(private readonly db: PrismaClient) {}

  findMany(filters: RepositoryDriveLinkFilters) {
    return this.db.driveLink.findMany({
      where: {
        ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
        ...(filters.isActive === undefined ? {} : { isActive: filters.isActive }),
        ...(filters.grade ? { subject: { grade: filters.grade } } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: driveLinkSelect,
    });
  }

  findById(id: number) {
    return this.db.driveLink.findUnique({ where: { id }, select: driveLinkSelect });
  }

  findByIds(ids: number[]) {
    return this.db.driveLink.findMany({ where: { id: { in: ids } }, select: driveLinkSelect });
  }

  async findMaxSortOrder(subjectId: number) {
    const aggregate = await this.db.driveLink.aggregate({ where: { subjectId }, _max: { sortOrder: true } });
    return aggregate._max.sortOrder;
  }

  create(data: DriveLinkWriteInput) {
    return this.db.driveLink.create({ data, select: driveLinkSelect });
  }

  update(id: number, data: DriveLinkWriteInput) {
    return this.db.driveLink.update({ where: { id }, data, select: driveLinkSelect });
  }

  updateStatus(id: number, isActive: boolean) {
    return this.db.driveLink.update({ where: { id }, data: { isActive }, select: driveLinkSelect });
  }

  async delete(id: number) {
    await this.db.driveLink.delete({ where: { id } });
  }

  async reorder(subjectId: number, items: DriveLinkOrderItem[]) {
    await this.db.$transaction(async (transaction) => {
      for (const { id, sortOrder } of items) {
        const result = await transaction.driveLink.updateMany({ where: { id, subjectId }, data: { sortOrder } });
        if (result.count !== 1) throw new Error("Drive Link reorder membership changed");
      }
    });
  }

  findPublicBySubjectId(subjectId: number) {
    return this.db.driveLink.findMany({
      where: { subjectId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: publicDriveLinkSelect,
    });
  }
}
