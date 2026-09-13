// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("../services/announcement-service", () => ({ announcementService: { getActiveAnnouncements: mocks.load } }));
import type { Announcement } from "@/types/announcement";
import { AnnouncementsSection } from "./announcements-section";

const item: Announcement = {
  id: 1, title: "إعلان تجريبي", content: "تفاصيل الإعلان",
  badge: null, imageUrl: null, ctaLabel: null, ctaUrl: null, sortOrder: 1,
};

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.load.mockResolvedValue([]); });

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); });
});

describe("announcements section", () => {
  it("opens and closes announcement details without optional media or CTA", async () => {
    const user = userEvent.setup();
    render(<AnnouncementsSection announcements={[item]} />);
    const opener = screen.getByRole("button", { name: /عرض التفاصيل/ });
    await user.click(opener);
    expect(screen.getByRole("dialog").hasAttribute("open")).toBe(true);
    expect(within(screen.getByRole("dialog")).getByText("تفاصيل الإعلان")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    await user.click(screen.getByRole("button", { name: "إغلاق الإعلان" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
  it("hides the section when the API result is empty", () => { const view = render(<AnnouncementsSection announcements={[]} />); expect(view.container.innerHTML).toBe(""); });
  it("keeps announcement text outside an uploaded image", async () => {
    const user = userEvent.setup();
    render(<AnnouncementsSection announcements={[{ ...item, imageUrl: "https://cdn.example.com/promo.png" }]} />);
    await user.click(screen.getByRole("button", { name: /عرض التفاصيل/ }));
    const dialog = screen.getByRole("dialog");
    const imageArea = within(dialog).getByRole("figure", { name: "صورة الإعلان" });
    expect(within(imageArea).queryByText("إعلان تجريبي")).toBeNull();
    expect(within(dialog).getByRole("heading", { name: "إعلان تجريبي" })).toBeTruthy();
  });
  it("shows a retryable Arabic error when the API is unavailable", async () => { mocks.load.mockRejectedValue(new Error("offline")); render(<AnnouncementsSection />); await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("تعذر تحميل الإعلانات")); expect(screen.getByRole("button", { name: "إعادة المحاولة" })).toBeTruthy(); });
});
