// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubjectQuickNavigation } from "./subject-quick-navigation";
import type { PublicSubject } from "@/types/public-content";

const subjects: readonly PublicSubject[] = [
  { id: 1, grade: "TAWJIHI", name: "الرياضيات", slug: "mathematics" },
  { id: 2, grade: "TAWJIHI", name: "الفيزياء", slug: "physics" },
];

describe("SubjectQuickNavigation", () => {
  it("marks the current subject and links directly to the other subjects", () => {
    render(
      <SubjectQuickNavigation
        subjects={subjects}
        currentSlug="mathematics"
      />,
    );

    expect(screen.getByText("انتقل إلى مادة أخرى")).toBeTruthy();
    expect(screen.getByText("الرياضيات").closest("[aria-current='page']")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "الرياضيات" })).toBeNull();
    expect(screen.getByRole("link", { name: "الفيزياء" }).getAttribute("href")).toBe(
      "/subjects/physics",
    );
  });
});
