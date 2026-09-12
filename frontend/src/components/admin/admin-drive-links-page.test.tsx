// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), getGrades: vi.fn(), getSubjects: vi.fn(), getDriveLinks: vi.fn(), create: vi.fn(), update: vi.fn(), status: vi.fn(), remove: vi.fn(), reorder: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }), useSearchParams: () => new URLSearchParams("subjectId=1") }));
vi.mock("../../services/admin-grade-service", () => {
  class AdminGradeError extends Error { constructor(public readonly kind: string) { super(kind); } }
  return { AdminGradeError, adminGradeService: { getGrades: mocks.getGrades } };
});
vi.mock("../../services/admin-subject-service", () => {
  class AdminSubjectError extends Error { constructor(public readonly kind: string) { super(kind); } }
  return { AdminSubjectError, adminSubjectService: { getSubjects: mocks.getSubjects } };
});
vi.mock("../../services/admin-drive-link-service", () => {
  class AdminDriveLinkError extends Error { constructor(public readonly kind: string, public readonly fields = {}) { super(kind); } }
  return { AdminDriveLinkError, adminDriveLinkService: { getDriveLinks: mocks.getDriveLinks, createDriveLink: mocks.create, updateDriveLink: mocks.update, updateDriveLinkStatus: mocks.status, deleteDriveLink: mocks.remove, reorderDriveLinks: mocks.reorder } };
});

import { AdminDriveLinkError } from "../../services/admin-drive-link-service";
import { AdminDriveLinksPage } from "./admin-drive-links-page";

const grades = [
  { id: 1, name: "عاشر", slug: "tenth", sortOrder: 1, isActive: true, createdAt: "2026", updatedAt: "2026", subjectCount: 1 },
  { id: 2, name: "حادي عشر", slug: "eleventh", sortOrder: 2, isActive: true, createdAt: "2026", updatedAt: "2026", subjectCount: 1 },
  { id: 3, name: "توجيهي", slug: "tawjihi", sortOrder: 3, isActive: true, createdAt: "2026", updatedAt: "2026", subjectCount: 1 },
];
const subject = { id: 1, name: "الرياضيات", slug: "mathematics", gradeId: 3, grade: grades[2]!, isActive: true, createdAt: "2026", updatedAt: "2026" };
const tenthSubject = { ...subject, id: 2, name: "علوم عاشر", slug: "tenth-science", gradeId: 1, grade: grades[0]! };
const eleventhSubject = { ...subject, id: 3, name: "فيزياء حادي عشر", slug: "eleventh-physics", gradeId: 2, grade: grades[1]! };
const driveLink = { id: 1, title: "الفرع العلمي", description: "شرح", subjectId: 1, driveUrl: "https://drive.google.com/one", sortOrder: 1, isActive: true, createdAt: "2026", updatedAt: "2026", subject };
const second = { ...driveLink, id: 2, title: "الفرع الأدبي", driveUrl: "https://drive.google.com/two", sortOrder: 2 };
beforeEach(() => {
  mocks.getGrades.mockResolvedValue(grades);
  mocks.getSubjects.mockResolvedValue([subject, tenthSubject, eleventhSubject]); mocks.getDriveLinks.mockResolvedValue([driveLink, second]);
  mocks.create.mockResolvedValue(driveLink); mocks.update.mockResolvedValue(driveLink); mocks.status.mockResolvedValue(driveLink);
  mocks.remove.mockResolvedValue({ id: 1 }); mocks.reorder.mockResolvedValue(null);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("AdminDriveLinksPage", () => {
  it("renders, preselects subject query, and sends backend filters", async () => {
    const user = userEvent.setup(); render(<AdminDriveLinksPage />);
    expect((await screen.findAllByText("الفرع العلمي")).length).toBeGreaterThan(0);
    expect((screen.getByLabelText("المادة") as HTMLSelectElement).value).toBe("1");
    expect(mocks.getDriveLinks).toHaveBeenCalledWith({ status: "all", subjectId: 1 });
    await user.selectOptions(screen.getByLabelText("الحالة"), "inactive");
    await user.selectOptions(screen.getByLabelText("الصف"), "2");
    await waitFor(() => expect(mocks.getDriveLinks).toHaveBeenLastCalledWith({ status: "inactive", gradeId: 2 }));
  });
  it.each([
    ["3", "الرياضيات", ["علوم عاشر", "فيزياء حادي عشر"]],
    ["1", "علوم عاشر", ["الرياضيات", "فيزياء حادي عشر"]],
    ["2", "فيزياء حادي عشر", ["الرياضيات", "علوم عاشر"]],
  ] as const)("filters Subject options for %s", async (selectedGrade, expected, excluded) => {
    const user = userEvent.setup(); render(<AdminDriveLinksPage />); await screen.findAllByText("الفرع العلمي");
    await user.selectOptions(screen.getByLabelText("الصف"), selectedGrade);
    const optionLabels = within(screen.getByLabelText("المادة")).getAllByRole("option").map((option) => option.textContent);
    expect(optionLabels).toEqual(["الكل", expected]);
    expect(optionLabels[1]).not.toContain("—");
    excluded.forEach((label) => expect(optionLabels).not.toContain(label));
  });
  it("shows all Subjects for the all-grade filter", async () => {
    render(<AdminDriveLinksPage />); await screen.findAllByText("الفرع العلمي");
    const optionLabels = within(screen.getByLabelText("المادة")).getAllByRole("option").map((option) => option.textContent);
    expect(optionLabels).toEqual(["الكل", "الرياضيات — توجيهي", "علوم عاشر — عاشر", "فيزياء حادي عشر — حادي عشر"]);
  });
  it("resets a selected Subject when the new grade does not contain it", async () => {
    const user = userEvent.setup(); render(<AdminDriveLinksPage />); await screen.findAllByText("الفرع العلمي");
    expect((screen.getByLabelText("المادة") as HTMLSelectElement).value).toBe("1");
    await user.selectOptions(screen.getByLabelText("الصف"), "1");
    expect((screen.getByLabelText("المادة") as HTMLSelectElement).value).toBe("");
    await waitFor(() => expect(mocks.getDriveLinks).toHaveBeenLastCalledWith({ status: "all", gradeId: 1 }));
  });
  it("validates and creates a link", async () => {
    const user = userEvent.setup(); render(<AdminDriveLinksPage />); await screen.findAllByText("الفرع العلمي");
    await user.click(screen.getByRole("button", { name: "إضافة رابط" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "إضافة الرابط" }));
    expect(within(dialog).getByText("عنوان الرابط مطلوب.")).toBeTruthy();
    await user.type(within(dialog).getByLabelText("عنوان الرابط *"), "مراجعات");
    await user.type(within(dialog).getByLabelText("رابط Google Drive *"), "https://drive.google.com/reviews");
    await user.click(within(dialog).getByRole("button", { name: "إضافة الرابط" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({ title: "مراجعات", description: null, subjectId: 1, driveUrl: "https://drive.google.com/reviews", isActive: true }));
  });
  it("edits, changes status, permanently deletes, and reorders", async () => {
    const user = userEvent.setup(); const confirm = vi.spyOn(window, "confirm").mockReturnValue(true); render(<AdminDriveLinksPage />); await screen.findAllByText("الفرع العلمي");
    await user.click(screen.getAllByRole("button", { name: "تعديل" })[0]!);
    const dialog = screen.getByRole("dialog"); await user.clear(within(dialog).getByLabelText("عنوان الرابط *")); await user.type(within(dialog).getByLabelText("عنوان الرابط *"), "محدث"); await user.click(within(dialog).getByRole("button", { name: "حفظ التعديلات" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    await user.click(screen.getAllByRole("button", { name: "تعطيل" })[0]!); await waitFor(() => expect(mocks.status).toHaveBeenCalledWith(1, false));
    await user.click(screen.getAllByRole("button", { name: "حذف نهائي" })[0]!); await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(1));
    await user.click(screen.getAllByRole("button", { name: "تحريك لأسفل" })[0]!); await waitFor(() => expect(mocks.reorder).toHaveBeenCalledWith({ subjectId: 1, items: [{ id: 2, sortOrder: 1 }, { id: 1, sortOrder: 2 }] }));
    expect(confirm).toHaveBeenCalled(); confirm.mockRestore();
  });
  it("redirects unauthorized and shows backend validation safely", async () => {
    mocks.getDriveLinks.mockRejectedValueOnce(new AdminDriveLinkError("unauthorized")); render(<AdminDriveLinksPage />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/admin/login")); cleanup();
    mocks.getDriveLinks.mockResolvedValue([driveLink]); mocks.create.mockRejectedValue(new AdminDriveLinkError("validation", { driveUrl: "raw" }));
    const user = userEvent.setup(); render(<AdminDriveLinksPage />); await screen.findAllByText("الفرع العلمي"); await user.click(screen.getByRole("button", { name: "إضافة رابط" })); const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("عنوان الرابط *"), "مراجعات"); await user.type(within(dialog).getByLabelText("رابط Google Drive *"), "https://drive.google.com/reviews"); await user.click(within(dialog).getByRole("button", { name: "إضافة الرابط" }));
    expect(await within(dialog).findByRole("alert")).toBeTruthy();
  });
});
