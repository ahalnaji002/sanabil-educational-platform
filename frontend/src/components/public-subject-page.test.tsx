// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getPublicDriveLinks: vi.fn(), getPublicSubjects: vi.fn() }));
vi.mock("../services/public-content-service", () => {
  class PublicContentError extends Error { constructor(public readonly kind: string) { super(kind); } }
  return { PublicContentError, publicContentService: mocks };
});
vi.mock("./site-header", () => ({ SiteHeader: () => <header /> }));
vi.mock("./site-footer", () => ({ SiteFooter: () => <footer /> }));

import { PublicContentError } from "../services/public-content-service";
import { PublicSubjectPage } from "./public-subject-page";

const subject = { id: 1, name: "الرياضيات", slug: "mathematics", grade: "TAWJIHI" as const };
beforeEach(() => {
  Object.defineProperty(window, "scrollTo", { value: vi.fn(), writable: true });
  mocks.getPublicSubjects.mockResolvedValue([subject]);
  mocks.getPublicDriveLinks.mockResolvedValue({ subject, driveLinks: [
    { id: 2, title: "الأول", description: null, driveUrl: "https://drive.google.com/first", sortOrder: 1 },
    { id: 1, title: "الثاني", description: null, driveUrl: "https://drive.google.com/second", sortOrder: 2 },
  ] });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("PublicSubjectPage", () => {
  it("loads public links and preserves API order", async () => {
    render(<PublicSubjectPage slug="mathematics" />);
    expect(await screen.findByRole("heading", { name: "الرياضيات" })).toBeTruthy();
    const links = screen.getAllByRole("link", { name: /فتح على Google Drive/ });
    expect(links.map((item) => item.getAttribute("href"))).toEqual(["https://drive.google.com/first", "https://drive.google.com/second"]);
    expect(mocks.getPublicDriveLinks).toHaveBeenCalledWith("mathematics");
  });
  it("shows an empty Drive Links state", async () => {
    mocks.getPublicDriveLinks.mockResolvedValue({ subject, driveLinks: [] });
    render(<PublicSubjectPage slug="mathematics" />);
    expect(await screen.findByText("لا توجد روابط متاحة لهذه المادة حاليًا.")).toBeTruthy();
  });
  it("shows safe not-found and API failure states", async () => {
    mocks.getPublicDriveLinks.mockRejectedValueOnce(new PublicContentError("not-found"));
    const first = render(<PublicSubjectPage slug="missing" />);
    expect(await screen.findByRole("heading", { name: "المادة غير متاحة" })).toBeTruthy();
    first.unmount();
    mocks.getPublicDriveLinks.mockRejectedValueOnce(new PublicContentError("network"));
    render(<PublicSubjectPage slug="mathematics" />);
    expect(await screen.findByRole("heading", { name: "تعذر تحميل المادة" })).toBeTruthy();
  });
});
