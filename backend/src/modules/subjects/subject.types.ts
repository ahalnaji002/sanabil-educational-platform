export type SubjectStatus = "active" | "inactive" | "all";

export type SubjectGrade = { id: number; name: string; slug: string; sortOrder: number; isActive: boolean };

export type SubjectFilters = {
  status: SubjectStatus;
  gradeId?: number;
};

export type SubjectRecord = {
  id: number;
  name: string;
  slug: string;
  gradeId: number;
  grade: SubjectGrade;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SubjectWriteInput = {
  name: string;
  slug: string;
  gradeId: number;
  isActive: boolean;
};

export type PublicSubject = Pick<SubjectRecord, "id" | "name" | "slug"> & { grade: Pick<SubjectGrade, "id" | "name" | "slug"> };
