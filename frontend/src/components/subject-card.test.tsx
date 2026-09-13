import { describe, expect, it } from "vitest";
import { getSubjectIcon } from "./subject-card";

describe("getSubjectIcon", () => {
  it.each([
    ["الرياضيات", "mathematics", "calculator"],
    ["الفيزياء", "physics", "atom"],
    ["الكيمياء", "chemistry", "flask"],
    ["أحياء", "biology", "biology"],
    ["اللغة الإنجليزية", "english", "language"],
    ["تكنولوجيا المعلومات", "technology", "technology"],
    ["اللغة العربية", "arabic", "book"],
  ])("selects the appropriate icon for %s", (name, slug, expected) => {
    expect(getSubjectIcon({ name, slug })).toBe(expected);
  });
});
