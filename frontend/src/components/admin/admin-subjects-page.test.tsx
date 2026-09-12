// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  getGrades: vi.fn(),
  getSubjects: vi.fn(),
  createSubject: vi.fn(),
  updateSubject: vi.fn(),
  deactivateSubject: vi.fn(),
  query: { value: "" },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace, push: mocks.push }), useSearchParams: () => new URLSearchParams(mocks.query.value) }));
vi.mock("../../services/admin-grade-service", () => {
  class AdminGradeError extends Error { constructor(public readonly kind: string) { super(kind); } }
  return { AdminGradeError, adminGradeService: { getGrades: mocks.getGrades } };
});
vi.mock("../../services/admin-subject-service", async () => {
  class AdminSubjectError extends Error {
    constructor(public readonly kind: string, public readonly fields: Record<string, string> = {}) { super(kind); }
  }
  return {
    AdminSubjectError,
    adminSubjectService: {
      getSubjects: mocks.getSubjects,
      createSubject: mocks.createSubject,
      updateSubject: mocks.updateSubject,
      deactivateSubject: mocks.deactivateSubject,
    },
  };
});

import { AdminSubjectError } from "../../services/admin-subject-service";
import { AdminSubjectsPage } from "./admin-subjects-page";

const grades = [
  { id: 1, name: "عاشر", slug: "tenth", sortOrder: 1, isActive: true, createdAt: "2026", updatedAt: "2026", subjectCount: 2 },
  { id: 2, name: "حادي عشر", slug: "eleventh", sortOrder: 2, isActive: true, createdAt: "2026", updatedAt: "2026", subjectCount: 1 },
  { id: 3, name: "توجيهي", slug: "tawjihi", sortOrder: 3, isActive: true, createdAt: "2026", updatedAt: "2026", subjectCount: 7 },
];
const subject = { id: 1, name: "الرياضيات", slug: "mathematics", gradeId: 3, grade: grades[2]!, isActive: true, createdAt: "2026-09-12", updatedAt: "2026-09-12" };

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.value = "";
  mocks.getGrades.mockResolvedValue(grades);
  mocks.getSubjects.mockResolvedValue([subject]);
  mocks.createSubject.mockResolvedValue(subject);
  mocks.updateSubject.mockResolvedValue(subject);
  mocks.deactivateSubject.mockResolvedValue({ ...subject, isActive: false });
});

describe("AdminSubjectsPage", () => {
  it("renders subjects and requests server filters", async () => {
    const user = userEvent.setup();
    render(<AdminSubjectsPage />);
    expect((await screen.findAllByText("الرياضيات")).length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText("الحالة"), "inactive");
    await user.selectOptions(screen.getByLabelText("الصف"), "2");
    await waitFor(() => expect(mocks.getSubjects).toHaveBeenLastCalledWith({ status: "inactive", gradeId: 2 }));
  });
  it("loads dynamic Grades and preselects gradeId from the query string", async () => {
    mocks.query.value = "gradeId=2";
    render(<AdminSubjectsPage />);
    await screen.findAllByText("الرياضيات");
    expect((screen.getByLabelText("الصف") as HTMLSelectElement).value).toBe("2");
    expect(mocks.getGrades).toHaveBeenCalledWith("all");
    expect(mocks.getSubjects).toHaveBeenCalledWith({ status: "all", gradeId: 2 });
  });

  it("validates and completes the create flow", async () => {
    const user = userEvent.setup();
    render(<AdminSubjectsPage />);
    await screen.findAllByText("الرياضيات");
    await user.click(screen.getByRole("button", { name: "إضافة مادة" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "إضافة المادة" }));
    expect(within(dialog).getByText("اسم المادة مطلوب.")).toBeTruthy();
    expect(mocks.createSubject).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText("اسم المادة"), "الأحياء");
    await user.type(within(dialog).getByLabelText("الرابط المختصر (slug)"), "biology");
    await user.click(within(dialog).getByRole("button", { name: "إضافة المادة" }));
    await waitFor(() => expect(mocks.createSubject).toHaveBeenCalledWith({ name: "الأحياء", slug: "biology", gradeId: 1, isActive: true }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("supports edit and confirmed soft-deactivation", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminSubjectsPage />);
    await screen.findAllByText("الرياضيات");

    await user.click(screen.getAllByRole("button", { name: "تعديل" })[0]!);
    const dialog = screen.getByRole("dialog");
    const nameInput = within(dialog).getByLabelText("اسم المادة");
    await user.clear(nameInput);
    await user.type(nameInput, "رياضيات متقدمة");
    await user.click(within(dialog).getByRole("button", { name: "حفظ التعديلات" }));
    await waitFor(() => expect(mocks.updateSubject).toHaveBeenCalledWith(1, { name: "رياضيات متقدمة", slug: "mathematics", gradeId: 3, isActive: true }));

    await user.click(screen.getAllByRole("button", { name: "تعطيل" })[0]!);
    expect(confirm).toHaveBeenCalledOnce();
    await waitFor(() => expect(mocks.deactivateSubject).toHaveBeenCalledWith(1));
    confirm.mockRestore();
  });

  it("renders backend conflicts safely and redirects unauthorized requests", async () => {
    const user = userEvent.setup();
    mocks.createSubject.mockRejectedValue(new AdminSubjectError("conflict", { slug: "raw backend text" }));
    render(<AdminSubjectsPage />);
    await screen.findAllByText("الرياضيات");
    await user.click(screen.getByRole("button", { name: "إضافة مادة" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("اسم المادة"), "أحياء");
    await user.type(within(dialog).getByLabelText("الرابط المختصر (slug)"), "biology");
    await user.click(within(dialog).getByRole("button", { name: "إضافة المادة" }));
    expect(await within(dialog).findByText("هذا الرابط المختصر مستخدم لمادة أخرى.")).toBeTruthy();

    cleanup();
    mocks.getSubjects.mockRejectedValue(new AdminSubjectError("unauthorized"));
    render(<AdminSubjectsPage />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/admin/login"));
  });
});
