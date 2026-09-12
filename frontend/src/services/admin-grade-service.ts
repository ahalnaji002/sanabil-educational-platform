import axios from "axios";
import { ApiConfigurationError, apiClient, assertApiConfigured } from "../lib/api-client";
import type { AdminGrade, CreateGradeInput, GradeReorderInput, GradeStatus, UpdateGradeInput } from "../types/grade";

type ApiSuccess<T> = { success: true; message: string; data: T };
type ApiFailure = { success?: false; errors?: Record<string, string> };
export type AdminGradeErrorKind = "validation" | "unauthorized" | "forbidden" | "not-found" | "conflict" | "network" | "configuration" | "unexpected";
export class AdminGradeError extends Error {
  constructor(public readonly kind: AdminGradeErrorKind, public readonly fields: Record<string, string> = {}) { super(kind); this.name = "AdminGradeError"; }
}
function normalize(error: unknown) {
  if (error instanceof AdminGradeError) return error;
  if (error instanceof ApiConfigurationError) return new AdminGradeError("configuration");
  if (!axios.isAxiosError<ApiFailure>(error)) return new AdminGradeError("unexpected");
  if (!error.response) return new AdminGradeError("network");
  const kinds: Partial<Record<number, AdminGradeErrorKind>> = { 400: "validation", 401: "unauthorized", 403: "forbidden", 404: "not-found", 409: "conflict" };
  return new AdminGradeError(kinds[error.response.status] ?? "unexpected", error.response.data?.errors ?? {});
}
async function request<T>(operation: () => Promise<{ data: ApiSuccess<T> }>): Promise<T> { try { assertApiConfigured(); return (await operation()).data.data; } catch (error) { throw normalize(error); } }
export const adminGradeService = {
  getGrades: (status: GradeStatus = "all") => request<{ grades: AdminGrade[] }>(() => apiClient.get("/api/admin/grades", { params: { status } })).then(({ grades }) => grades),
  getGrade: (id: number) => request<{ grade: AdminGrade }>(() => apiClient.get(`/api/admin/grades/${String(id)}`)).then(({ grade }) => grade),
  createGrade: (input: CreateGradeInput) => request<{ grade: AdminGrade }>(() => apiClient.post("/api/admin/grades", input)).then(({ grade }) => grade),
  updateGrade: (id: number, input: UpdateGradeInput) => request<{ grade: AdminGrade }>(() => apiClient.put(`/api/admin/grades/${String(id)}`, input)).then(({ grade }) => grade),
  updateGradeStatus: (id: number, isActive: boolean) => request<{ grade: AdminGrade }>(() => apiClient.patch(`/api/admin/grades/${String(id)}/status`, { isActive })).then(({ grade }) => grade),
  reorderGrades: (input: GradeReorderInput) => request<null>(() => apiClient.patch("/api/admin/grades/reorder", input)),
};
