// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { localGrades } from "../data/grades";
import { localSubjects } from "../data/subjects";
import { SubjectsSection } from "./subjects-section";

afterEach(cleanup);

describe("SubjectsSection", () => {
  it("waits for a grade selection before showing subjects", () => {
    render(<SubjectsSection grades={localGrades} subjects={localSubjects} />);

    expect(screen.getByRole("heading", { name: "اختر صفك الدراسي" })).toBeTruthy();
    expect(screen.queryByText("الرياضيات")).toBeNull();
  });

  it("shows Tawjihi subjects and an empty state for grades without content", async () => {
    const user = userEvent.setup();
    render(<SubjectsSection grades={localGrades} subjects={localSubjects} />);

    await user.click(screen.getByRole("button", { name: "توجيهي" }));
    expect(screen.getByText("الرياضيات")).toBeTruthy();
    expect(screen.getByRole("button", { name: "توجيهي" }).getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByRole("button", { name: "عاشر" }));
    expect(screen.queryByText("الرياضيات")).toBeNull();
    expect(screen.getByText("سيتم إضافة مواد هذا الصف قريبًا")).toBeTruthy();
  });
});
