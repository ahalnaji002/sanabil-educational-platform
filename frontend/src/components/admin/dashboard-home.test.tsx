// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("./admin-context", () => ({ useAdmin: () => ({ name: "مدير سنابل", role: "ADMIN" }) }));
import { DashboardHome } from "./dashboard-home";

describe("DashboardHome", () => {
  it("links implemented sections and marks only Announcements as coming soon", () => {
    render(<DashboardHome />);
    expect(screen.getAllByRole("link", { name: "فتح" }).map((link) => link.getAttribute("href"))).toEqual([
      "/admin/dashboard/grades", "/admin/dashboard/subjects", "/admin/dashboard/drive-links",
    ]);
    expect(screen.getAllByText("قريبًا")).toHaveLength(1);
    expect(screen.getByText("الإعلانات").closest("article")?.textContent).toContain("قريبًا");
  });
});
