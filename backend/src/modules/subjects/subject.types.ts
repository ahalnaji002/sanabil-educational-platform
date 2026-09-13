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
  sortOrder: number;
  grade: SubjectGrade;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SubjectWriteInput = {
  name: string;
  slug: string;
  gradeId: number;
  sortOrder: number;
  isActive: boolean;
};

export type SubjectOrderItem = { id: number; sortOrder: number };

export type PublicSubject = Pick<SubjectRecord, "id" | "name" | "slug"> & { grade: Pick<SubjectGrade, "id" | "name" | "slug"> };
