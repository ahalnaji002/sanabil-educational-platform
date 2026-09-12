import { Prisma } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";
import type { CreateGradeBody, GradeListQuery, ReorderGradesBody, UpdateGradeBody } from "./grade.schema.js";
import type { GradeRepository } from "./grade.repository.js";
import type { GradeRecord, GradeWriteInput, PublicGrade } from "./grade.types.js";

const normalize = (input: CreateGradeBody | UpdateGradeBody, sortOrder: number): GradeWriteInput => ({ name: input.name.trim(), slug: input.slug.trim().toLowerCase(), sortOrder, isActive: input.isActive });
const uniqueError = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export class GradeService {
  constructor(private readonly repository: GradeRepository) {}
  list(query: GradeListQuery) { return this.repository.findMany(query.status === "all" ? undefined : query.status === "active"); }
  async getById(id: number) { const grade = await this.repository.findById(id); if (!grade) throw new ApiError(404, "Grade not found"); return grade; }
  async create(input: CreateGradeBody): Promise<GradeRecord> {
    if (await this.repository.findBySlug(input.slug)) throw new ApiError(409, "Grade slug already exists", { slug: "Slug is already in use" });
    const data = normalize(input, input.sortOrder ?? ((await this.repository.findMaxSortOrder()) ?? -1) + 1);
    try { return await this.repository.create(data); } catch (error) { if (uniqueError(error)) throw new ApiError(409, "Grade slug already exists", { slug: "Slug is already in use" }); throw error; }
  }
  async update(id: number, input: UpdateGradeBody): Promise<GradeRecord> {
    await this.getById(id);
    const duplicate = await this.repository.findBySlug(input.slug);
    if (duplicate && duplicate.id !== id) throw new ApiError(409, "Grade slug already exists", { slug: "Slug is already in use" });
    try { return await this.repository.update(id, normalize(input, input.sortOrder)); } catch (error) { if (uniqueError(error)) throw new ApiError(409, "Grade slug already exists", { slug: "Slug is already in use" }); throw error; }
  }
  async updateStatus(id: number, isActive: boolean) { const grade = await this.getById(id); return grade.isActive === isActive ? grade : this.repository.updateStatus(id, isActive); }
  async reorder(input: ReorderGradesBody) {
    const grades = await this.repository.findByIds(input.items.map(({ id }) => id));
    if (grades.length !== input.items.length) throw new ApiError(400, "All Grades must exist", { items: "One or more Grades do not exist" });
    await this.repository.reorder(input.items);
  }
  listPublic(): Promise<PublicGrade[]> { return this.repository.findPublic(); }
}
