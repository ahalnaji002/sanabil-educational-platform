import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ get: vi.fn(), assertApiConfigured: vi.fn() }));
vi.mock("../lib/api-client", () => ({ apiClient: { get: mocks.get }, assertApiConfigured: mocks.assertApiConfigured, ApiConfigurationError: class ApiConfigurationError extends Error {} }));
import { announcementService } from "./announcement-service";
const announcement = { id: 1, title: "إعلان", content: "التفاصيل", badge: null, ctaLabel: null, ctaUrl: null, sortOrder: 1 };
beforeEach(() => vi.clearAllMocks());
describe("announcementService", () => {
  it("loads public announcements from the API", async () => { mocks.get.mockResolvedValue({ data: { success: true, data: { announcements: [announcement] } } }); await expect(announcementService.getActiveAnnouncements()).resolves.toEqual([announcement]); expect(mocks.get).toHaveBeenCalledWith("/api/public/announcements"); });
  it("normalizes an unavailable API", async () => { mocks.get.mockRejectedValue({}); await expect(announcementService.getActiveAnnouncements()).rejects.toMatchObject({ kind: "unexpected" }); });
});
