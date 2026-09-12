import axios from "axios";
import { ApiConfigurationError, apiClient, assertApiConfigured } from "../lib/api-client";
import type { AdminDriveLink, CreateDriveLinkInput, DriveLinkFilters, DriveLinkReorderInput, UpdateDriveLinkInput } from "../types/admin-drive-link";

type ApiSuccess<T> = { success: true; message: string; data: T };
type ApiFailure = { success?: false; message?: string; errors?: Record<string, string> };
export type AdminDriveLinkErrorKind = "validation" | "unauthorized" | "forbidden" | "not-found" | "network" | "configuration" | "unexpected";
export class AdminDriveLinkError extends Error {
  constructor(public readonly kind: AdminDriveLinkErrorKind, public readonly fields: Record<string, string> = {}) { super(kind); this.name = "AdminDriveLinkError"; }
}
function normalizeError(error: unknown) {
  if (error instanceof AdminDriveLinkError) return error;
  if (error instanceof ApiConfigurationError) return new AdminDriveLinkError("configuration");
  if (!axios.isAxiosError<ApiFailure>(error)) return new AdminDriveLinkError("unexpected");
  if (!error.response) return new AdminDriveLinkError("network");
  const kinds: Partial<Record<number, AdminDriveLinkErrorKind>> = { 400: "validation", 401: "unauthorized", 403: "forbidden", 404: "not-found" };
  return new AdminDriveLinkError(kinds[error.response.status] ?? "unexpected", error.response.data?.errors ?? {});
}
async function driveLinkRequest<T>(request: () => Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  try { assertApiConfigured(); return (await request()).data.data; } catch (error) { throw normalizeError(error); }
}
export const adminDriveLinkService = {
  getDriveLinks: (filters: DriveLinkFilters) => driveLinkRequest<{ driveLinks: AdminDriveLink[] }>(() => apiClient.get("/api/admin/drive-links", { params: { status: filters.status, ...(filters.subjectId ? { subjectId: filters.subjectId } : {}), ...(filters.gradeId ? { gradeId: filters.gradeId } : {}) } })).then(({ driveLinks }) => driveLinks),
  getDriveLink: (id: number) => driveLinkRequest<{ driveLink: AdminDriveLink }>(() => apiClient.get(`/api/admin/drive-links/${String(id)}`)).then(({ driveLink }) => driveLink),
  createDriveLink: (input: CreateDriveLinkInput) => driveLinkRequest<{ driveLink: AdminDriveLink }>(() => apiClient.post("/api/admin/drive-links", input)).then(({ driveLink }) => driveLink),
  updateDriveLink: (id: number, input: UpdateDriveLinkInput) => driveLinkRequest<{ driveLink: AdminDriveLink }>(() => apiClient.put(`/api/admin/drive-links/${String(id)}`, input)).then(({ driveLink }) => driveLink),
  updateDriveLinkStatus: (id: number, isActive: boolean) => driveLinkRequest<{ driveLink: AdminDriveLink }>(() => apiClient.patch(`/api/admin/drive-links/${String(id)}/status`, { isActive })).then(({ driveLink }) => driveLink),
  deleteDriveLink: (id: number) => driveLinkRequest<{ id: number }>(() => apiClient.delete(`/api/admin/drive-links/${String(id)}`)),
  reorderDriveLinks: (input: DriveLinkReorderInput) => driveLinkRequest<null>(() => apiClient.patch("/api/admin/drive-links/reorder", input)),
};
