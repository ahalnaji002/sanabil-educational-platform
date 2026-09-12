export type AnnouncementStatus = "active" | "inactive" | "all";
export type AnnouncementVisibility = "current" | "scheduled" | "expired" | "all";

export type AnnouncementRecord = {
  id: number;
  title: string;
  content: string;
  badge: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AnnouncementWriteInput = Omit<AnnouncementRecord, "id" | "createdAt" | "updatedAt">;
export type AnnouncementOrderItem = { id: number; sortOrder: number };
export type PublicAnnouncement = Pick<AnnouncementRecord, "id" | "title" | "content" | "badge" | "imageUrl" | "ctaLabel" | "ctaUrl" | "sortOrder">;
