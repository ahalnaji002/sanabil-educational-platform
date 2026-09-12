import type { Prisma, PrismaClient } from "@prisma/client";
import type { GradeOrderItem, GradeRecord, GradeWriteInput, PublicGrade } from "./grade.types.js";

export interface GradeRepository {
  findMany(isActive?: boolean): Promise<GradeRecord[]>;
  findById(id: number): Promise<GradeRecord | null>;
  findBySlug(slug: string): Promise<GradeRecord | null>;
  findMaxSortOrder(): Promise<number | null>;
  create(data: GradeWriteInput): Promise<GradeRecord>;
  update(id: number, data: GradeWriteInput): Promise<GradeRecord>;
  updateStatus(id: number, isActive: boolean): Promise<GradeRecord>;
  findByIds(ids: number[]): Promise<GradeRecord[]>;
  reorder(items: GradeOrderItem[]): Promise<void>;
  findPublic(): Promise<PublicGrade[]>;
}

const gradeSelect = {
  id: true, name: true, slug: true, sortOrder: true, isActive: true, createdAt: true, updatedAt: true,
  _count: { select: { subjects: true } },
} satisfies Prisma.GradeSelect;
const mapGrade = (grade: Prisma.GradeGetPayload<{ select: typeof gradeSelect }>): GradeRecord => {
  const { _count, ...record } = grade;
  return { ...record, subjectCount: _count.subjects };
};

export class PrismaGradeRepository implements GradeRepository {
  constructor(private readonly db: PrismaClient) {}
  async findMany(isActive?: boolean) { return (await this.db.grade.findMany({ where: isActive === undefined ? {} : { isActive }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: gradeSelect })).map(mapGrade); }
  async findById(id: number) { const grade = await this.db.grade.findUnique({ where: { id }, select: gradeSelect }); return grade ? mapGrade(grade) : null; }
  async findBySlug(slug: string) { const grade = await this.db.grade.findUnique({ where: { slug }, select: gradeSelect }); return grade ? mapGrade(grade) : null; }
  async findMaxSortOrder() { return (await this.db.grade.aggregate({ _max: { sortOrder: true } }))._max.sortOrder; }
  async create(data: GradeWriteInput) { return mapGrade(await this.db.grade.create({ data, select: gradeSelect })); }
  async update(id: number, data: GradeWriteInput) { return mapGrade(await this.db.grade.update({ where: { id }, data, select: gradeSelect })); }
  async updateStatus(id: number, isActive: boolean) { return mapGrade(await this.db.grade.update({ where: { id }, data: { isActive }, select: gradeSelect })); }
  async findByIds(ids: number[]) { return (await this.db.grade.findMany({ where: { id: { in: ids } }, select: gradeSelect })).map(mapGrade); }
  async reorder(items: GradeOrderItem[]) {
    await this.db.$transaction(async (transaction) => {
      for (const { id, sortOrder } of items) {
        const result = await transaction.grade.updateMany({ where: { id }, data: { sortOrder } });
        if (result.count !== 1) throw new Error("Grade reorder membership changed");
      }
    });
  }
  findPublic() { return this.db.grade.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true, name: true, slug: true, sortOrder: true } }); }
}
