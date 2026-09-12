import { ApiError } from "../../utils/api-error.js";
import type { SubjectRepository } from "../subjects/subject.repository.js";
import type {
  CreateDriveLinkBody,
  DriveLinkListQuery,
  ReorderDriveLinksBody,
  UpdateDriveLinkBody,
} from "./drive-link.schema.js";
import type { DriveLinkRepository } from "./drive-link.repository.js";
import type { DriveLinkRecord, PublicDriveLink } from "./drive-link.types.js";

const normalizeDescription = (value: string | null | undefined) => value?.trim() || null;

export class DriveLinkService {
  constructor(
    private readonly repository: DriveLinkRepository,
    private readonly subjectRepository: SubjectRepository,
  ) {}

  list(filters: DriveLinkListQuery): Promise<DriveLinkRecord[]> {
    return this.repository.findMany({
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      ...(filters.grade ? { grade: filters.grade } : {}),
      ...(filters.status === "all" ? {} : { isActive: filters.status === "active" }),
    });
  }

  async getById(id: number): Promise<DriveLinkRecord> {
    const link = await this.repository.findById(id);
    if (!link) throw new ApiError(404, "Drive link not found");
    return link;
  }

  private async requireSubject(subjectId: number) {
    const subject = await this.subjectRepository.findById(subjectId);
    if (!subject) throw new ApiError(400, "Subject does not exist", { subjectId: "Subject does not exist" });
    return subject;
  }

  private requireGoogleDriveUrl(value: string) {
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && url.hostname.toLowerCase() === "drive.google.com") return;
    } catch {
      // The safe application error below intentionally hides URL parser details.
    }
    throw new ApiError(400, "Invalid Google Drive URL", { driveUrl: "A secure drive.google.com URL is required" });
  }

  async create(input: CreateDriveLinkBody): Promise<DriveLinkRecord> {
    await this.requireSubject(input.subjectId);
    this.requireGoogleDriveUrl(input.driveUrl);
    const sortOrder = input.sortOrder ?? ((await this.repository.findMaxSortOrder(input.subjectId)) ?? -1) + 1;
    return this.repository.create({
      title: input.title.trim(),
      description: normalizeDescription(input.description),
      subjectId: input.subjectId,
      driveUrl: input.driveUrl.trim(),
      sortOrder,
      isActive: input.isActive,
    });
  }

  async update(id: number, input: UpdateDriveLinkBody): Promise<DriveLinkRecord> {
    await this.getById(id);
    await this.requireSubject(input.subjectId);
    this.requireGoogleDriveUrl(input.driveUrl);
    return this.repository.update(id, {
      title: input.title.trim(),
      description: normalizeDescription(input.description),
      subjectId: input.subjectId,
      driveUrl: input.driveUrl.trim(),
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    });
  }

  async updateStatus(id: number, isActive: boolean): Promise<DriveLinkRecord> {
    const link = await this.getById(id);
    return link.isActive === isActive ? link : this.repository.updateStatus(id, isActive);
  }

  async delete(id: number): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }

  async reorder(input: ReorderDriveLinksBody): Promise<void> {
    await this.requireSubject(input.subjectId);
    const links = await this.repository.findByIds(input.items.map(({ id }) => id));
    if (links.length !== input.items.length || links.some(({ subjectId }) => subjectId !== input.subjectId)) {
      throw new ApiError(400, "All links must belong to the selected Subject", { items: "Links must belong to subjectId" });
    }
    await this.repository.reorder(input.subjectId, input.items);
  }

  async listPublic(slug: string): Promise<{ subject: { id: number; name: string; slug: string; grade: DriveLinkRecord["subject"]["grade"] }; driveLinks: PublicDriveLink[] }> {
    const subject = await this.subjectRepository.findBySlug(slug);
    if (!subject || !subject.isActive) throw new ApiError(404, "Subject not found");
    const driveLinks = await this.repository.findPublicBySubjectId(subject.id);
    return { subject: { id: subject.id, name: subject.name, slug: subject.slug, grade: subject.grade }, driveLinks };
  }
}
