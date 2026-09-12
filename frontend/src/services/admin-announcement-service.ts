import axios from "axios";
import { ApiConfigurationError, apiClient, assertApiConfigured } from "../lib/api-client";
import type { AdminAnnouncement, AnnouncementFilters, AnnouncementInput } from "../types/announcement";

type ApiSuccess<T> = { success: true; message: string; data: T };
type ApiFailure = { errors?: Record<string, string> };
export type AdminAnnouncementErrorKind = "validation" | "unauthorized" | "forbidden" | "not-found" | "network" | "configuration" | "unexpected";
export class AdminAnnouncementError extends Error { constructor(public readonly kind: AdminAnnouncementErrorKind, public readonly fields: Record<string, string> = {}) { super(kind); this.name = "AdminAnnouncementError"; } }
function normalize(error: unknown) { if (error instanceof ApiConfigurationError) return new AdminAnnouncementError("configuration"); if (!axios.isAxiosError<ApiFailure>(error)) return new AdminAnnouncementError("unexpected"); if (!error.response) return new AdminAnnouncementError("network"); const kinds: Partial<Record<number, AdminAnnouncementErrorKind>> = { 400: "validation", 401: "unauthorized", 403: "forbidden", 404: "not-found" }; return new AdminAnnouncementError(kinds[error.response.status] ?? "unexpected", error.response.data?.errors ?? {}); }
function formData(input: AnnouncementInput) {
  const data = new FormData();
  data.set("title", input.title); data.set("content", input.content); data.set("badge", input.badge ?? "");
  data.set("ctaLabel", input.ctaLabel ?? ""); data.set("ctaUrl", input.ctaUrl ?? ""); data.set("sortOrder", String(input.sortOrder));
  data.set("isActive", String(input.isActive)); data.set("startsAt", input.startsAt ?? ""); data.set("endsAt", input.endsAt ?? "");
  data.set("removeImage", String(input.removeImage)); if (input.image) data.set("image", input.image);
  return data;
}
async function request<T>(operation: () => Promise<{ data: ApiSuccess<T> }>) { try { assertApiConfigured(); return (await operation()).data.data; } catch (error) { throw normalize(error); } }
export const adminAnnouncementService = {
  getAnnouncements: (filters: AnnouncementFilters) => request<{ announcements: AdminAnnouncement[] }>(() => apiClient.get("/api/admin/announcements", { params: filters })).then(({ announcements }) => announcements),
  createAnnouncement: (input: AnnouncementInput) => request<{ announcement: AdminAnnouncement }>(() => apiClient.post("/api/admin/announcements", formData(input))).then(({ announcement }) => announcement),
  updateAnnouncement: (id: number, input: AnnouncementInput) => request<{ announcement: AdminAnnouncement }>(() => apiClient.put(`/api/admin/announcements/${String(id)}`, formData(input))).then(({ announcement }) => announcement),
  updateStatus: (id: number, isActive: boolean) => request<{ announcement: AdminAnnouncement }>(() => apiClient.patch(`/api/admin/announcements/${String(id)}/status`, { isActive })).then(({ announcement }) => announcement),
  reorder: (items: { id: number; sortOrder: number }[]) => request<null>(() => apiClient.patch("/api/admin/announcements/reorder", { items })),
};
