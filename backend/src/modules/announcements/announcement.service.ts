import { ApiError } from "../../utils/api-error.js";
import type { AnnouncementListQuery, CreateAnnouncementBody, ReorderAnnouncementsBody, UpdateAnnouncementBody } from "./announcement.schema.js";
import type { AnnouncementRepository } from "./announcement.repository.js";
import type { AnnouncementRecord, AnnouncementWriteInput, PublicAnnouncement } from "./announcement.types.js";
import { deleteAnnouncementUpload } from "./announcement-upload.js";

const normalize = (input: CreateAnnouncementBody | UpdateAnnouncementBody, sortOrder: number, imageUrl: string | null): AnnouncementWriteInput => ({
  title: input.title.trim(), content: input.content.trim(), badge: input.badge?.trim() || null,
  imageUrl,
  ctaLabel: input.ctaLabel?.trim() || null, ctaUrl: input.ctaUrl?.trim() || null, sortOrder,
  isActive: input.isActive, startsAt: input.startsAt ? new Date(input.startsAt) : null, endsAt: input.endsAt ? new Date(input.endsAt) : null,
});

export class AnnouncementService {
  constructor(private readonly repository: AnnouncementRepository, private readonly now: () => Date = () => new Date()) {}
  list(query: AnnouncementListQuery) { return this.repository.findMany({ now: this.now(), visibility: query.visibility, ...(query.status === "all" ? {} : { isActive: query.status === "active" }) }); }
  async getById(id: number) { const announcement = await this.repository.findById(id); if (!announcement) throw new ApiError(404, "Announcement not found"); return announcement; }
  async create(input: CreateAnnouncementBody, uploadedImageUrl: string | null): Promise<AnnouncementRecord> { const sortOrder = input.sortOrder ?? ((await this.repository.findMaxSortOrder()) ?? -1) + 1; return this.repository.create(normalize(input, sortOrder, uploadedImageUrl)); }
  async update(id: number, input: UpdateAnnouncementBody, uploadedImageUrl?: string) {
    const current = await this.getById(id);
    const imageUrl = uploadedImageUrl ?? (input.removeImage ? null : current.imageUrl);
    const updated = await this.repository.update(id, normalize(input, input.sortOrder, imageUrl));
    if (current.imageUrl && current.imageUrl !== imageUrl) await deleteAnnouncementUpload(current.imageUrl);
    return updated;
  }
  async updateStatus(id: number, isActive: boolean) { const item = await this.getById(id); return item.isActive === isActive ? item : this.repository.updateStatus(id, isActive); }
  async reorder(input: ReorderAnnouncementsBody) { const items = await this.repository.findByIds(input.items.map(({ id }) => id)); if (items.length !== input.items.length) throw new ApiError(400, "All Announcements must exist", { items: "One or more Announcements do not exist" }); await this.repository.reorder(input.items); }
  listPublic(): Promise<PublicAnnouncement[]> { return this.repository.findPublic(this.now()); }
}
