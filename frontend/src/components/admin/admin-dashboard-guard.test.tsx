// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  getCurrentAdmin: vi.fn(),
  logout: vi.fn(),
}));
const { replace, getCurrentAdmin, logout } = mocks;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
  usePathname: () => "/admin/dashboard",
}));
vi.mock("../../services/admin-auth-service", async () => {
  class AdminAuthError extends Error {
    constructor(public readonly kind: string) { super(kind); }
  }
  return { AdminAuthError, adminAuthService: { getCurrentAdmin: mocks.getCurrentAdmin, logout: mocks.logout } };
});

import { AdminAuthError } from "../../services/admin-auth-service";
import { AdminDashboardGuard } from "./admin-dashboard-guard";
import { DashboardHome } from "./dashboard-home";

const admin = { id: 1, name: "مدير سنابل", email: "admin@example.com", role: "SUPER_ADMIN" as const };

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe("AdminDashboardGuard", () => {
  it("does not render dashboard content and redirects an unauthenticated visitor", async () => {
    getCurrentAdmin.mockRejectedValue(new AdminAuthError("unauthorized"));
    render(<AdminDashboardGuard><p>محتوى خاص</p></AdminDashboardGuard>);

    expect(screen.queryByText("محتوى خاص")).toBeNull();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/login"));
  });

  it("renders safe admin data after authentication and logs out through the backend", async () => {
    const user = userEvent.setup();
    getCurrentAdmin.mockResolvedValue(admin);
    logout.mockResolvedValue({});
    render(<AdminDashboardGuard><DashboardHome /></AdminDashboardGuard>);

    expect(await screen.findByRole("heading", { name: "مدير سنابل" })).toBeTruthy();
    expect(screen.getByText("الدور: مدير عام")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "تسجيل الخروج" }));

    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(replace).toHaveBeenCalledWith("/admin/login");
  });
});
