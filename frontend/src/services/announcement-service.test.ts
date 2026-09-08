import { describe, expect, it } from "vitest";
import { announcementService } from "./announcement-service";

describe("local announcement service", () => {
  it("returns only active announcements in display order", async () => {
    const announcements = await announcementService.getActiveAnnouncements(new Date("2026-09-08"));
    expect(announcements.map(({ id }) => id)).toEqual([1, 2]);
    expect(announcements.every(({ isActive }) => isActive)).toBe(true);
  });

  it("supports announcements without an image or CTA", async () => {
    const announcements = await announcementService.getActiveAnnouncements();
    expect(announcements.some(({ image }) => image === null)).toBe(true);
    expect(announcements.some(({ ctaUrl, ctaLabel }) => ctaUrl === null && ctaLabel === null)).toBe(true);
  });
});
