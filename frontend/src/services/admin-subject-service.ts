import axios from "axios";
import { ApiConfigurationError, apiClient, assertApiConfigured } from "../lib/api-client";
import type {
  AdminSubject,
  CreateSubjectInput,
  SubjectFilters,
  UpdateSubjectInput,
} from "../types/admin-subject";

type ApiSuccess<T> = { success: true; message: string; data: T };
type ApiFailure = { success?: false; message?: string; errors?: Record<string, string> };

export type AdminSubjectErrorKind =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "network"
  | "configuration"
  | "unexpected";

export class AdminSubjectError extends Error {
  constructor(
    public readonly kind: AdminSubjectErrorKind,
    public readonly fields: Record<string, string> = {},
  ) {
    super(kind);
    this.name = "AdminSubjectError";
  }
}

function normalizeError(error: unknown): AdminSubjectError {
  if (error instanceof AdminSubjectError) return error;
  if (error instanceof ApiConfigurationError) return new AdminSubjectError("configuration");
  if (!axios.isAxiosError<ApiFailure>(error)) return new AdminSubjectError("unexpected");
  if (!error.response) return new AdminSubjectError("network");

  const fields = error.response.data?.errors ?? {};
  const kinds: Partial<Record<number, AdminSubjectErrorKind>> = {
    400: "validation",
    401: "unauthorized",
    403: "forbidden",
    404: "not-found",
    409: "conflict",
  };
  return new AdminSubjectError(kinds[error.response.status] ?? "unexpected", fields);
}

async function subjectRequest<T>(request: () => Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  try {
    assertApiConfigured();
    return (await request()).data.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export const adminSubjectService = {
  getSubjects: (filters: SubjectFilters) => subjectRequest<{ subjects: AdminSubject[] }>(() =>
    apiClient.get("/api/admin/subjects", {
      params: { status: filters.status, ...(filters.grade ? { grade: filters.grade } : {}) },
    }),
  ).then(({ subjects }) => subjects),

  getSubject: (id: number) => subjectRequest<{ subject: AdminSubject }>(() =>
    apiClient.get(`/api/admin/subjects/${String(id)}`),
  ).then(({ subject }) => subject),

  createSubject: (input: CreateSubjectInput) => subjectRequest<{ subject: AdminSubject }>(() =>
    apiClient.post("/api/admin/subjects", input),
  ).then(({ subject }) => subject),

  updateSubject: (id: number, input: UpdateSubjectInput) => subjectRequest<{ subject: AdminSubject }>(() =>
    apiClient.put(`/api/admin/subjects/${String(id)}`, input),
  ).then(({ subject }) => subject),

  deactivateSubject: (id: number) => subjectRequest<{ subject: AdminSubject }>(() =>
    apiClient.delete(`/api/admin/subjects/${String(id)}`),
  ).then(({ subject }) => subject),
};
