export type Announcement = {
  id: number;
  title: string;
  content: string;
  badge: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  sortOrder: number;
};

export type AdminAnnouncement = Announcement & {
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementStatus = "active" | "inactive" | "all";
export type AnnouncementVisibility = "current" | "scheduled" | "expired" | "all";
export type AnnouncementInput = Omit<AdminAnnouncement, "id" | "imageUrl" | "createdAt" | "updatedAt"> & {
  image: File | null;
  removeImage: boolean;
};
export type AnnouncementFilters = { status: AnnouncementStatus; visibility: AnnouncementVisibility };
