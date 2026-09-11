// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubjectQuickNavigation } from "./subject-quick-navigation";
import type { Subject } from "@/types/subject";

const subjects: readonly Subject[] = [
  {
    id: 1,
    gradeId: "tawjihi",
    name: "الرياضيات",
    slug: "mathematics",
    icon: "calculator",
    summary: "رياضيات",
    links: [],
  },
  {
    id: 2,
    gradeId: "tawjihi",
    name: "الفيزياء",
    slug: "physics",
    icon: "atom",
    summary: "فيزياء",
    links: [],
  },
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
