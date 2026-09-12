import axios from "axios";
import { ApiConfigurationError, apiClient, assertApiConfigured } from "../lib/api-client";
import type { Admin } from "../types/admin";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type AdminAuthErrorKind =
  | "unauthorized"
  | "forbidden"
  | "network"
  | "configuration"
  | "unexpected";

export class AdminAuthError extends Error {
  constructor(public readonly kind: AdminAuthErrorKind) {
    super(kind);
    this.name = "AdminAuthError";
  }
}

function normalizeAuthError(error: unknown): AdminAuthError {
  if (error instanceof AdminAuthError) return error;
  if (error instanceof ApiConfigurationError) return new AdminAuthError("configuration");

  if (axios.isAxiosError(error)) {
    if (!error.response) return new AdminAuthError("network");
    if (error.response.status === 401) return new AdminAuthError("unauthorized");
    if (error.response.status === 403) return new AdminAuthError("forbidden");
  }

  return new AdminAuthError("unexpected");
}

async function authRequest<T>(request: () => Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  try {
    assertApiConfigured();
    return (await request()).data.data;
  } catch (error) {
    throw normalizeAuthError(error);
  }
}

export const adminAuthService = {
  getCurrentAdmin: () =>
    authRequest<{ admin: Admin }>(() => apiClient.get("/api/auth/me")).then(({ admin }) => admin),

  login: (email: string, password: string) =>
    authRequest<{ admin: Admin }>(() =>
      apiClient.post("/api/auth/login", { email, password }),
    ).then(({ admin }) => admin),

  logout: () => authRequest<Record<string, never>>(() => apiClient.post("/api/auth/logout", {})),
};
