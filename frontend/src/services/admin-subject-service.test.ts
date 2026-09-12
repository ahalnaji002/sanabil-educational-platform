import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  assertApiConfigured: vi.fn(),
}));

vi.mock("../lib/api-client", () => ({
  apiClient: { get: mocks.get, post: mocks.post, put: mocks.put, delete: mocks.delete },
  assertApiConfigured: mocks.assertApiConfigured,
  ApiConfigurationError: class ApiConfigurationError extends Error {},
}));

import { adminSubjectService } from "./admin-subject-service";

const grade = { id: 3, name: "توجيهي", slug: "tawjihi", sortOrder: 3, isActive: true };
const subject = { id: 1, name: "الرياضيات", slug: "mathematics", gradeId: 3, grade, isActive: true, createdAt: "2026-09-12", updatedAt: "2026-09-12" };

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
});

describe("adminSubjectService", () => {
  it("sends status and grade filters to the admin API", async () => {
    mocks.get.mockResolvedValue({ data: { success: true, message: "ok", data: { subjects: [subject] } } });
    await expect(adminSubjectService.getSubjects({ status: "inactive", gradeId: 2 })).resolves.toEqual([subject]);
    expect(mocks.get).toHaveBeenCalledWith("/api/admin/subjects", { params: { status: "inactive", gradeId: 2 } });
  });

  it("uses the shared API for create, update, and deactivate", async () => {
    const input = { name: subject.name, slug: subject.slug, gradeId: subject.gradeId, isActive: true };
    const response = { data: { success: true, message: "ok", data: { subject } } };
    mocks.post.mockResolvedValue(response);
    mocks.put.mockResolvedValue(response);
    mocks.delete.mockResolvedValue(response);

    await adminSubjectService.createSubject(input);
    await adminSubjectService.updateSubject(1, input);
    await adminSubjectService.deactivateSubject(1);

    expect(mocks.post).toHaveBeenCalledWith("/api/admin/subjects", input);
    expect(mocks.put).toHaveBeenCalledWith("/api/admin/subjects/1", input);
    expect(mocks.delete).toHaveBeenCalledWith("/api/admin/subjects/1");
  });
});
