export type Grade = "TENTH" | "ELEVENTH" | "TAWJIHI";
export type SubjectStatus = "active" | "inactive" | "all";

export type AdminSubject = {
  id: number;
  name: string;
  slug: string;
  grade: Grade;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateSubjectInput = {
  name: string;
  slug: string;
  grade: Grade;
  isActive: boolean;
};

export type UpdateSubjectInput = CreateSubjectInput;

export type SubjectFilters = {
  status: SubjectStatus;
  grade?: Grade;
};
