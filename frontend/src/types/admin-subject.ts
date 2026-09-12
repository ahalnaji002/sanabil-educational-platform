import type { GradeReference } from "./grade";
export type SubjectStatus = "active" | "inactive" | "all";

export type AdminSubject = {
  id: number;
  name: string;
  slug: string;
  gradeId: number;
  grade: GradeReference;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateSubjectInput = {
  name: string;
  slug: string;
  gradeId: number;
  isActive: boolean;
};

export type UpdateSubjectInput = CreateSubjectInput;

export type SubjectFilters = {
  status: SubjectStatus;
  gradeId?: number;
};
