// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Announcement } from "@/types/announcement";
import { AnnouncementsSection } from "./announcements-section";

const item: Announcement = {
  id: 1, title: "إعلان تجريبي", summary: "ملخص الإعلان", details: "تفاصيل الإعلان",
  image: null, badge: null, ctaLabel: null, ctaUrl: null, isActive: true,
  sortOrder: 1, startsAt: null, endsAt: null,
};

afterEach(cleanup);

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
    expect(screen.getByText("تفاصيل الإعلان")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    await user.click(screen.getByRole("button", { name: "إغلاق الإعلان" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
  it("shows the full details for an announcement with an image", async () => {
    const user = userEvent.setup();
    const imageAnnouncement = {
      ...item,
      id: 2,
      image: "/announcements/subject-destinations.png",
    };

    const view = render(<AnnouncementsSection announcements={[imageAnnouncement]} />);
    await user.click(view.getByRole("button", { name: /عرض التفاصيل/ }));

    expect(view.getByRole("dialog").hasAttribute("open")).toBe(true);
    expect(view.getByText("تفاصيل الإعلان")).toBeTruthy();
    expect(view.getByRole("button", { name: "إغلاق الإعلان" })).toBeTruthy();
  });
});
