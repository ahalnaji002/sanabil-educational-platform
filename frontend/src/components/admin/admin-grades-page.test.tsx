// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(), push: vi.fn(), getGrades: vi.fn(), create: vi.fn(), update: vi.fn(), status: vi.fn(), reorder: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace, push: mocks.push }) }));
vi.mock("../../services/admin-grade-service", () => {
  class AdminGradeError extends Error { constructor(public readonly kind: string, public readonly fields: Record<string, string> = {}) { super(kind); } }
  return { AdminGradeError, adminGradeService: { getGrades: mocks.getGrades, createGrade: mocks.create, updateGrade: mocks.update, updateGradeStatus: mocks.status, reorderGrades: mocks.reorder } };
});
import { AdminGradesPage } from "./admin-grades-page";

const grades = [
  { id: 1, name: "عاشر", slug: "tenth", sortOrder: 1, isActive: true, createdAt: "2026", updatedAt: "2026", subjectCount: 2 },
  { id: 3, name: "توجيهي", slug: "tawjihi", sortOrder: 2, isActive: false, createdAt: "2026", updatedAt: "2026", subjectCount: 7 },
];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getGrades.mockResolvedValue(grades);
  mocks.create.mockResolvedValue(grades[0]);
  mocks.update.mockResolvedValue(grades[0]);
  mocks.status.mockResolvedValue(grades[0]);
  mocks.reorder.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("AdminGradesPage", () => {
  it("lists dynamic Grades, subjectCount, and navigates to filtered Subjects", async () => {
    const user = userEvent.setup();
    render(<AdminGradesPage />);
    expect((await screen.findAllByText("عاشر")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "عرض المواد" })[0]!);
    expect(mocks.push).toHaveBeenCalledWith("/admin/dashboard/subjects?gradeId=1");
  });
  it("adds and edits a Grade", async () => {
    const user = userEvent.setup();
    render(<AdminGradesPage />);
    await screen.findAllByText("عاشر");
    await user.click(screen.getByRole("button", { name: "إضافة صف" }));
    let dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("اسم الصف"), "تاسع");
    await user.type(within(dialog).getByLabelText("الرابط المختصر (slug)"), "Ninth");
    await user.click(within(dialog).getByRole("button", { name: "إضافة الصف" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({ name: "تاسع", slug: "ninth", isActive: true }));
    await user.click(screen.getAllByRole("button", { name: "تعديل" })[0]!);
    dialog = screen.getByRole("dialog");
    const name = within(dialog).getByLabelText("اسم الصف");
    await user.clear(name);
    await user.type(name, "عاشر جديد");
    await user.click(within(dialog).getByRole("button", { name: "حفظ التعديلات" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(1, { name: "عاشر جديد", slug: "tenth", sortOrder: 1, isActive: true }));
  });
  it("confirms deactivation, activates directly, and reorders", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminGradesPage />);
    await screen.findAllByText("عاشر");
    await user.click(screen.getAllByRole("button", { name: "تعطيل" })[0]!);
    await waitFor(() => expect(mocks.status).toHaveBeenCalledWith(1, false));
    expect(confirm).toHaveBeenCalled();
    await user.click(screen.getAllByRole("button", { name: "تفعيل" })[0]!);
    await waitFor(() => expect(mocks.status).toHaveBeenCalledWith(3, true));
    await user.click(screen.getAllByRole("button", { name: "تحريك لأسفل" })[0]!);
    await waitFor(() => expect(mocks.reorder).toHaveBeenCalledWith({ items: [{ id: 3, sortOrder: 1 }, { id: 1, sortOrder: 2 }] }));
    confirm.mockRestore();
  });
});
