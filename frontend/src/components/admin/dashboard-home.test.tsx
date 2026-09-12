// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("./admin-context", () => ({ useAdmin: () => ({ name: "مدير سنابل", role: "ADMIN" }) }));
vi.mock("../../services/admin-dashboard-service", () => ({ adminDashboardService: { getSummary: () => Promise.resolve({ activeGrades: 3, activeSubjects: 10, activeDriveLinks: 8, activeAnnouncements: 2 }) } }));
import { DashboardHome } from "./dashboard-home";

describe("DashboardHome", () => {
  it("links all implemented sections and renders real counts", async () => {
    render(<DashboardHome />);
    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/admin/dashboard/grades", "/admin/dashboard/subjects", "/admin/dashboard/drive-links", "/admin/dashboard/announcements",
    ]);
    expect(screen.getAllByRole("link")[0]?.textContent).toContain("الصفوف");
    expect(screen.queryByText("فتح")).toBeNull();
    expect(screen.queryByText("قريبًا")).toBeNull();
    expect(await screen.findByText("3 نشط")).toBeTruthy();
  });
});
