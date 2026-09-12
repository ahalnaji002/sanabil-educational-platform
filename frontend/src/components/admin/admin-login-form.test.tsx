// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  getCurrentAdmin: vi.fn(),
  login: vi.fn(),
}));
const { replace, getCurrentAdmin, login } = mocks;

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }) }));
vi.mock("../../services/admin-auth-service", async () => {
  class AdminAuthError extends Error {
    constructor(public readonly kind: string) { super(kind); }
  }
  return { AdminAuthError, adminAuthService: { getCurrentAdmin: mocks.getCurrentAdmin, login: mocks.login } };
});

import { AdminAuthError } from "../../services/admin-auth-service";
import { AdminLoginForm } from "./admin-login-form";

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  getCurrentAdmin.mockRejectedValue(new AdminAuthError("unauthorized"));
});

describe("AdminLoginForm", () => {
  it("logs in and redirects to the dashboard", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ id: 1, name: "مدير", email: "admin@example.com", role: "ADMIN" });
    render(<AdminLoginForm />);

    await user.type(await screen.findByLabelText("البريد الإلكتروني"), "admin@example.com");
    await user.type(screen.getByLabelText("كلمة المرور"), "Password1");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/dashboard"));
    expect(login).toHaveBeenCalledWith("admin@example.com", "Password1");
  });

  it("shows a generic message for invalid credentials", async () => {
    const user = userEvent.setup();
    login.mockRejectedValue(new AdminAuthError("unauthorized"));
    render(<AdminLoginForm />);

    await user.type(await screen.findByLabelText("البريد الإلكتروني"), "admin@example.com");
    await user.type(screen.getByLabelText("كلمة المرور"), "wrong");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    expect((await screen.findByRole("alert")).textContent).toContain("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    expect(replace).not.toHaveBeenCalledWith("/admin/dashboard");
  });
});
