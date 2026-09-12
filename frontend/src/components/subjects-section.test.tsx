// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localGrades } from "../data/grades";
import { SubjectsSection } from "./subjects-section";

const mocks = vi.hoisted(() => ({ getPublicSubjects: vi.fn() }));
vi.mock("../services/public-content-service", () => ({ publicContentService: { getPublicSubjects: mocks.getPublicSubjects } }));

afterEach(cleanup);

describe("SubjectsSection", () => {
  beforeEach(() => { mocks.getPublicSubjects.mockReset(); mocks.getPublicSubjects.mockResolvedValue([]); });
  it("waits for a grade selection before showing subjects", () => {
    render(<SubjectsSection grades={localGrades} />);

    expect(screen.getByRole("heading", { name: "اختر صفك الدراسي" })).toBeTruthy();
    expect(screen.queryByText("الرياضيات")).toBeNull();
  });

  it("shows Tawjihi subjects and an empty state for grades without content", async () => {
    const user = userEvent.setup();
    mocks.getPublicSubjects.mockImplementation((grade: string) => Promise.resolve(grade === "TAWJIHI" ? [{ id: 1, name: "الرياضيات", slug: "mathematics", grade: "TAWJIHI" }] : []));
    render(<SubjectsSection grades={localGrades} />);

    await user.click(screen.getByRole("button", { name: "توجيهي" }));
    expect(await screen.findByText("الرياضيات")).toBeTruthy();
    expect(mocks.getPublicSubjects).toHaveBeenCalledWith("TAWJIHI");
    expect(screen.getByRole("button", { name: "توجيهي" }).getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByRole("button", { name: "عاشر" }));
    expect(screen.queryByText("الرياضيات")).toBeNull();
    expect(await screen.findByText("لا توجد مواد متاحة لهذا الصف حاليًا.")).toBeTruthy();
  });

  it("shows a safe API failure state", async () => {
    mocks.getPublicSubjects.mockRejectedValue(new Error("network details"));
    const user = userEvent.setup();
    render(<SubjectsSection grades={localGrades} />);
    await user.click(screen.getByRole("button", { name: "عاشر" }));
    expect((await screen.findByRole("alert")).textContent).toContain("تعذر تحميل المواد حاليًا");
  });
});
