import { describe, expect, it } from "vitest";
import { subjectService } from "./subject-service";
describe("local subject service", () => {
  it("lists subjects and resolves a subject by slug", async () => {
    const subjects = await subjectService.getSubjects();
    expect(subjects).toHaveLength(7);
    expect((await subjectService.getSubjectBySlug("mathematics"))?.name).toBe("الرياضيات");
    expect((await subjectService.getSubjectBySlug("biology"))?.name).toBe("أحياء");
    expect((await subjectService.getSubjectBySlug("technology"))?.name).toBe("تكنولوجيا علمي");
  });
  it("returns null for unknown slugs", async () => {
    expect(await subjectService.getSubjectBySlug("missing")).toBeNull();
  });
});
