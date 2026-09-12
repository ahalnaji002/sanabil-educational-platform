import type { Grade } from "@prisma/client";

export type SubjectStatus = "active" | "inactive" | "all";

export type SubjectFilters = {
  status: SubjectStatus;
  grade?: Grade;
};

export type SubjectRecord = {
  id: number;
  name: string;
  slug: string;
  grade: Grade;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SubjectWriteInput = {
  name: string;
  slug: string;
  grade: Grade;
  isActive: boolean;
};

export type PublicSubject = Pick<SubjectRecord, "id" | "name" | "slug" | "grade">;
