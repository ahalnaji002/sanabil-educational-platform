import axios from "axios";
import { ApiConfigurationError, apiClient, assertApiConfigured } from "../lib/api-client";
import type { Admin } from "../types/admin";
type ApiSuccess<T> = { success: true; message: string; data: T };
type ApiFailure = { errors?: Record<string, string> };
export type AdminProfileErrorKind = "validation" | "unauthorized" | "conflict" | "network" | "configuration" | "unexpected";
export class AdminProfileError extends Error { constructor(public readonly kind: AdminProfileErrorKind, public readonly fields: Record<string, string> = {}) { super(kind); this.name = "AdminProfileError"; } }
function normalize(error: unknown) { if (error instanceof ApiConfigurationError) return new AdminProfileError("configuration"); if (!axios.isAxiosError<ApiFailure>(error)) return new AdminProfileError("unexpected"); if (!error.response) return new AdminProfileError("network"); const kinds: Partial<Record<number, AdminProfileErrorKind>> = { 400: "validation", 401: "unauthorized", 409: "conflict" }; return new AdminProfileError(kinds[error.response.status] ?? "unexpected", error.response.data?.errors ?? {}); }
async function request<T>(operation: () => Promise<{ data: ApiSuccess<T> }>) { try { assertApiConfigured(); return (await operation()).data.data; } catch (error) { throw normalize(error); } }
export const adminProfileService = {
  updateProfile: (input: { name: string; email: string }) => request<{ admin: Admin }>(() => apiClient.put("/api/admin/profile", input)).then(({ admin }) => admin),
  updatePassword: (input: { currentPassword: string; newPassword: string; passwordConfirmation: string }) => request<null>(() => apiClient.put("/api/admin/profile/password", input)),
};
