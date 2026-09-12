import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("apiClient", () => {
  it("uses the configured API URL and sends credentials", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test/");
    const { apiClient, assertApiConfigured } = await import("./api-client");

    expect(() => assertApiConfigured()).not.toThrow();
    expect(apiClient.defaults.baseURL).toBe("https://api.example.test");
    expect(apiClient.defaults.withCredentials).toBe(true);
  });
});
