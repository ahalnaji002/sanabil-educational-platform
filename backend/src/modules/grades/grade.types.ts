export type GradeStatus = "active" | "inactive" | "all";

export type GradeRecord = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subjectCount: number;
};

export type GradeWriteInput = {
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type GradeOrderItem = { id: number; sortOrder: number };
export type PublicGrade = Pick<GradeRecord, "id" | "name" | "slug" | "sortOrder">;
