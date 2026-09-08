export type Announcement = {
  id: number;
  title: string;
  summary: string;
  details: string;
  image: string | null;
  badge: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
};
