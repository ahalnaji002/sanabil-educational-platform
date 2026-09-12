import { Prisma } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";
import type {
  CreateSubjectBody,
  PublicSubjectListQuery,
  SubjectListQuery,
  UpdateSubjectBody,
} from "./subject.schema.js";
import type { SubjectRepository } from "./subject.repository.js";
import type { PublicSubject, SubjectRecord, SubjectWriteInput } from "./subject.types.js";
import type { GradeRepository } from "../grades/grade.repository.js";

const normalizeInput = (input: CreateSubjectBody | UpdateSubjectBody): SubjectWriteInput => ({
  name: input.name.trim(),
  slug: input.slug.trim().toLowerCase(),
  gradeId: input.gradeId,
  isActive: input.isActive,
});

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export class SubjectService {
  constructor(private readonly repository: SubjectRepository, private readonly gradeRepository: GradeRepository) {}

  list(filters: SubjectListQuery): Promise<SubjectRecord[]> {
    return this.repository.findMany({
      ...(filters.gradeId ? { gradeId: filters.gradeId } : {}),
      ...(filters.status === "all" ? {} : { isActive: filters.status === "active" }),
    });
  }

  async getById(id: number): Promise<SubjectRecord> {
    const subject = await this.repository.findById(id);
    if (!subject) throw new ApiError(404, "Subject not found");
    return subject;
  }

  async create(input: CreateSubjectBody): Promise<SubjectRecord> {
    const data = normalizeInput(input);
    if (!await this.gradeRepository.findById(data.gradeId)) throw new ApiError(400, "Grade does not exist", { gradeId: "Grade does not exist" });
    if (await this.repository.findBySlug(data.slug)) {
      throw new ApiError(409, "Subject slug already exists", { slug: "Slug is already in use" });
    }

    try {
      return await this.repository.create(data);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ApiError(409, "Subject slug already exists", { slug: "Slug is already in use" });
      }
      throw error;
    }
  }

  async update(id: number, input: UpdateSubjectBody): Promise<SubjectRecord> {
    await this.getById(id);
    const data = normalizeInput(input);
    if (!await this.gradeRepository.findById(data.gradeId)) throw new ApiError(400, "Grade does not exist", { gradeId: "Grade does not exist" });
    const duplicate = await this.repository.findBySlug(data.slug);
    if (duplicate && duplicate.id !== id) {
      throw new ApiError(409, "Subject slug already exists", { slug: "Slug is already in use" });
    }

    try {
      return await this.repository.update(id, data);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ApiError(409, "Subject slug already exists", { slug: "Slug is already in use" });
      }
      throw error;
    }
  }

  async deactivate(id: number): Promise<SubjectRecord> {
    const subject = await this.getById(id);
    return subject.isActive ? this.repository.deactivate(id) : subject;
  }

  async listPublic(filters: PublicSubjectListQuery): Promise<PublicSubject[]> {
    const grade = filters.grade ? await this.gradeRepository.findBySlug(filters.grade) : null;
    if (filters.grade && (!grade || !grade.isActive)) throw new ApiError(404, "Grade not found");
    const subjects = await this.repository.findMany({
      isActive: true,
      ...(grade ? { gradeId: grade.id } : {}),
    });
    return subjects.filter((subject) => subject.grade.isActive).map(({ id, name, slug, grade: subjectGrade }) => ({ id, name, slug, grade: { id: subjectGrade.id, name: subjectGrade.name, slug: subjectGrade.slug } }));
  }
}
