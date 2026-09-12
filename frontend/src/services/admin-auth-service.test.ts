import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  assertApiConfigured: vi.fn(),
}));
const { get, post, assertApiConfigured } = mocks;

vi.mock("../lib/api-client", () => ({
  apiClient: { get: mocks.get, post: mocks.post },
  assertApiConfigured: mocks.assertApiConfigured,
  ApiConfigurationError: class ApiConfigurationError extends Error {},
}));

import { adminAuthService } from "./admin-auth-service";

const admin = { id: 1, name: "مدير سنابل", email: "admin@example.com", role: "SUPER_ADMIN" as const };

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  assertApiConfigured.mockReset();
});

describe("adminAuthService", () => {
  it("resolves the safe current admin response", async () => {
    get.mockResolvedValue({ data: { success: true, message: "ok", data: { admin } } });

    await expect(adminAuthService.getCurrentAdmin()).resolves.toEqual(admin);
    expect(get).toHaveBeenCalledWith("/api/auth/me");
    expect(admin).not.toHaveProperty("passwordHash");
  });

  it("posts login credentials and returns the admin without expecting a token", async () => {
    post.mockResolvedValue({ data: { success: true, message: "ok", data: { admin } } });

    await expect(adminAuthService.login("admin@example.com", "Password1")).resolves.toEqual(admin);
    expect(post).toHaveBeenCalledWith("/api/auth/login", { email: "admin@example.com", password: "Password1" });
  });

  it("calls the backend logout endpoint", async () => {
    post.mockResolvedValue({ data: { success: true, message: "ok", data: {} } });

    await adminAuthService.logout();
    expect(post).toHaveBeenCalledWith("/api/auth/logout", {});
  });
});
