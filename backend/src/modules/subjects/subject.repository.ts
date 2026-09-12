import type { Prisma, PrismaClient } from "@prisma/client";
import type { SubjectRecord, SubjectWriteInput } from "./subject.types.js";

export type RepositorySubjectFilters = {
  gradeId?: number;
  isActive?: boolean;
};

export interface SubjectRepository {
  findMany(filters: RepositorySubjectFilters): Promise<SubjectRecord[]>;
  findById(id: number): Promise<SubjectRecord | null>;
  findBySlug(slug: string): Promise<SubjectRecord | null>;
  create(data: SubjectWriteInput): Promise<SubjectRecord>;
  update(id: number, data: SubjectWriteInput): Promise<SubjectRecord>;
  deactivate(id: number): Promise<SubjectRecord>;
}

const subjectSelect = {
  id: true,
  name: true,
  slug: true,
  grade: { select: { id: true, name: true, slug: true, sortOrder: true, isActive: true } },
  gradeId: true,
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
      orderBy: [{ grade: { sortOrder: "asc" } }, { name: "asc" }, { id: "asc" }],
      select: subjectSelect,
    });
  }

  findById(id: number) {
    return this.db.subject.findUnique({ where: { id }, select: subjectSelect });
  }

  findBySlug(slug: string) {
    return this.db.subject.findUnique({ where: { slug }, select: subjectSelect });
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
}
