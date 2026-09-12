// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ profile: vi.fn(), password: vi.fn(), setAdmin: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("./admin-context", () => ({ useAdminContext: () => ({ admin: { id: 1, name: "مدير", email: "admin@example.com", role: "ADMIN" }, setAdmin: mocks.setAdmin }) }));
vi.mock("../../services/admin-profile-service", () => ({ AdminProfileError: class AdminProfileError extends Error { constructor(public kind: string, public fields = {}) { super(kind); } }, adminProfileService: { updateProfile: mocks.profile, updatePassword: mocks.password } }));
import { AdminSettingsPage } from "./admin-settings-page";
beforeEach(() => { vi.clearAllMocks(); mocks.profile.mockResolvedValue({ id: 1, name: "مدير جديد", email: "new@example.com", role: "ADMIN" }); mocks.password.mockResolvedValue(null); }); afterEach(cleanup);
describe("AdminSettingsPage", () => {
  it("updates profile and shared admin state", async () => { const user = userEvent.setup(); render(<AdminSettingsPage />); const name = screen.getByLabelText("الاسم"); await user.clear(name); await user.type(name, "مدير جديد"); const email = screen.getByLabelText("البريد الإلكتروني"); await user.clear(email); await user.type(email, "NEW@example.com"); await user.click(screen.getByRole("button", { name: "حفظ البيانات" })); await waitFor(() => expect(mocks.profile).toHaveBeenCalledWith({ name: "مدير جديد", email: "new@example.com" })); expect(mocks.setAdmin).toHaveBeenCalled(); });
  it("validates and changes a strong confirmed password", async () => { const user = userEvent.setup(); render(<AdminSettingsPage />); await user.type(screen.getByLabelText("كلمة المرور الحالية"), "OldPassword1"); await user.type(screen.getByLabelText("كلمة المرور الجديدة"), "NewPassword2"); await user.type(screen.getByLabelText("تأكيد كلمة المرور"), "NewPassword2"); await user.click(screen.getByRole("button", { name: "تغيير كلمة المرور" })); await waitFor(() => expect(mocks.password).toHaveBeenCalled()); expect(screen.getByText(/جلستك الحالية/)).toBeTruthy(); });
});
