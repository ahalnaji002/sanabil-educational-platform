import { describe, expect, it } from "vitest";
import { announcementService } from "./announcement-service";

describe("local announcement service", () => {
  it("returns only active announcements in display order", async () => {
    const announcements = await announcementService.getActiveAnnouncements(new Date("2026-09-08"));
    expect(announcements.map(({ id }) => id)).toEqual([1, 2]);
    expect(announcements.every(({ isActive }) => isActive)).toBe(true);
  });

  it("returns the configured image while keeping the CTA optional", async () => {
    const announcements = await announcementService.getActiveAnnouncements();
    const destinationsAnnouncement = announcements.find(({ id }) => id === 2);

    expect(destinationsAnnouncement?.image).toBe("/announcements/subject-destinations.png");
    expect(announcements.some(({ ctaUrl, ctaLabel }) => ctaUrl === null && ctaLabel === null)).toBe(true);
  });
});
