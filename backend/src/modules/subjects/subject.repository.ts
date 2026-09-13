import type { Prisma, PrismaClient } from "@prisma/client";
import type { SubjectOrderItem, SubjectRecord, SubjectWriteInput } from "./subject.types.js";

export type RepositorySubjectFilters = {
  gradeId?: number;
  isActive?: boolean;
};

export interface SubjectRepository {
  findMany(filters: RepositorySubjectFilters): Promise<SubjectRecord[]>;
  findById(id: number): Promise<SubjectRecord | null>;
  findBySlug(slug: string): Promise<SubjectRecord | null>;
  findByIds(ids: number[]): Promise<SubjectRecord[]>;
  findMaxSortOrder(gradeId: number): Promise<number | null>;
  create(data: SubjectWriteInput): Promise<SubjectRecord>;
  update(id: number, data: SubjectWriteInput): Promise<SubjectRecord>;
  deactivate(id: number): Promise<SubjectRecord>;
  reorder(gradeId: number, items: SubjectOrderItem[]): Promise<void>;
}

const subjectSelect = {
  id: true,
  name: true,
  slug: true,
  grade: { select: { id: true, name: true, slug: true, sortOrder: true, isActive: true } },
  gradeId: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SubjectSelect;

export class PrismaSubjectRepository implements SubjectRepository {
  constructor(private readonly db: PrismaClient) {}

  findMany(filters: RepositorySubjectFilters) {
    return this.db.subject.findMany({
      where: {
        ...(filters.gradeId ? { gradeId: filters.gradeId } : {}),
        ...(filters.isActive === undefined ? {} : { isActive: filters.isActive }),
      },
      orderBy: [{ grade: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
      select: subjectSelect,
    });
  }

  findById(id: number) {
    return this.db.subject.findUnique({ where: { id }, select: subjectSelect });
  }

  findBySlug(slug: string) {
    return this.db.subject.findUnique({ where: { slug }, select: subjectSelect });
  }

  findByIds(ids: number[]) {
    return this.db.subject.findMany({ where: { id: { in: ids } }, select: subjectSelect });
  }

  async findMaxSortOrder(gradeId: number) {
    return (await this.db.subject.aggregate({ where: { gradeId }, _max: { sortOrder: true } }))._max.sortOrder;
  }

  create(data: SubjectWriteInput) {
    return this.db.subject.create({ data, select: subjectSelect });
  }

  update(id: number, data: SubjectWriteInput) {
    return this.db.subject.update({ where: { id }, data, select: subjectSelect });
  }

  deactivate(id: number) {
    return this.db.subject.update({ where: { id }, data: { isActive: false }, select: subjectSelect });
  }


  async reorder(gradeId: number, items: SubjectOrderItem[]) {
    await this.db.$transaction(async (transaction) => {
      for (const { id, sortOrder } of items) {
        const result = await transaction.subject.updateMany({ where: { id, gradeId }, data: { sortOrder } });
        if (result.count !== 1) throw new Error("Subject reorder membership changed");
      }
    });
  }
}
