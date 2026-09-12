// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SubjectsSection } from "./subjects-section";

const mocks = vi.hoisted(() => ({ getPublicGrades: vi.fn(), getPublicSubjects: vi.fn() }));
vi.mock("../services/public-content-service", () => ({ publicContentService: mocks }));
const grades = [
  { id: 9, name: "تاسع", slug: "ninth", sortOrder: 0 },
  { id: 1, name: "عاشر", slug: "tenth", sortOrder: 1 },
  { id: 3, name: "توجيهي", slug: "tawjihi", sortOrder: 3 },
];

afterEach(cleanup);

describe("SubjectsSection", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getPublicGrades.mockResolvedValue(grades); mocks.getPublicSubjects.mockResolvedValue([]); });
  it("loads active grades and waits for a selection before showing subjects", async () => {
    render(<SubjectsSection />);

    expect(screen.getByRole("heading", { name: "اختر صفك الدراسي" })).toBeTruthy();
    expect(await screen.findByRole("button", { name: "عاشر" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "تاسع" })).toBeTruthy();
    expect(screen.queryByText("الرياضيات")).toBeNull();
  });

  it("shows Tawjihi subjects and an empty state for grades without content", async () => {
    const user = userEvent.setup();
    mocks.getPublicSubjects.mockImplementation((slug: string) => Promise.resolve(slug === "tawjihi" ? [{ id: 1, name: "الرياضيات", slug: "mathematics", grade: { id: 3, name: "توجيهي", slug: "tawjihi" } }] : []));
    render(<SubjectsSection />);

    await user.click(await screen.findByRole("button", { name: "توجيهي" }));
    expect(await screen.findByText("الرياضيات")).toBeTruthy();
    expect(mocks.getPublicSubjects).toHaveBeenCalledWith("tawjihi");
    expect(screen.getByRole("button", { name: "توجيهي" }).getAttribute("aria-pressed")).toBe("true");

    await user.click(await screen.findByRole("button", { name: "عاشر" }));
    expect(screen.queryByText("الرياضيات")).toBeNull();
    expect(await screen.findByText("لا توجد مواد متاحة لهذا الصف حاليًا.")).toBeTruthy();
  });

  it("shows a safe API failure state", async () => {
    mocks.getPublicSubjects.mockRejectedValue(new Error("network details"));
    const user = userEvent.setup();
    render(<SubjectsSection />);
    await user.click(await screen.findByRole("button", { name: "عاشر" }));
    expect((await screen.findByRole("alert")).textContent).toContain("تعذر تحميل المواد حاليًا");
  });
  it("shows a safe grade API failure state", async () => {
    mocks.getPublicGrades.mockRejectedValue(new Error("network"));
    render(<SubjectsSection />);
    expect((await screen.findByRole("alert")).textContent).toContain("تعذر تحميل الصفوف");
  });
});
