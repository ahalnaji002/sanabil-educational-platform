import axios from "axios";
import { ApiConfigurationError, apiClient, assertApiConfigured } from "../lib/api-client";
import type { Grade } from "../types/admin-subject";
import type { PublicDriveLinksResult, PublicSubject } from "../types/public-content";

type ApiSuccess<T> = { success: true; message: string; data: T };
export type PublicContentErrorKind = "not-found" | "network" | "configuration" | "unexpected";
export class PublicContentError extends Error {
  constructor(public readonly kind: PublicContentErrorKind) { super(kind); this.name = "PublicContentError"; }
}
function normalizeError(error: unknown) {
  if (error instanceof ApiConfigurationError) return new PublicContentError("configuration");
  if (!axios.isAxiosError(error)) return new PublicContentError("unexpected");
  if (!error.response) return new PublicContentError("network");
  return new PublicContentError(error.response.status === 404 ? "not-found" : "unexpected");
}
async function publicRequest<T>(request: () => Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  try { assertApiConfigured(); return (await request()).data.data; } catch (error) { throw normalizeError(error); }
}
export const publicContentService = {
  getPublicSubjects: (grade: Grade) => publicRequest<{ subjects: PublicSubject[] }>(() => apiClient.get("/api/public/subjects", { params: { grade } })).then(({ subjects }) => subjects),
  getPublicDriveLinks: (slug: string) => publicRequest<PublicDriveLinksResult>(() => apiClient.get(`/api/public/subjects/${encodeURIComponent(slug)}/drive-links`)),
};
