import { localAnnouncements } from "../data/announcements";
import type { Announcement } from "../types/announcement";

export interface AnnouncementService {
  getActiveAnnouncements(now?: Date): Promise<readonly Announcement[]>;
}

class LocalAnnouncementService implements AnnouncementService {
  async getActiveAnnouncements(now = new Date()) {
    const current = now.getTime();
    return Promise.resolve(
      localAnnouncements
        .filter((item) => item.isActive)
        .filter((item) => !item.startsAt || new Date(item.startsAt).getTime() <= current)
        .filter((item) => !item.endsAt || new Date(item.endsAt).getTime() >= current)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    );
  }
}

export const announcementService: AnnouncementService = new LocalAnnouncementService();
