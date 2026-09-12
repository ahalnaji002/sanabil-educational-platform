export type GradeReference = { id: number; name: string; slug: string; sortOrder: number; isActive: boolean };
export type AdminGrade = GradeReference & { createdAt: string; updatedAt: string; subjectCount: number };
export type PublicGrade = Pick<GradeReference, "id" | "name" | "slug" | "sortOrder">;
export type GradeStatus = "active" | "inactive" | "all";
export type CreateGradeInput = { name: string; slug: string; sortOrder?: number; isActive: boolean };
export type UpdateGradeInput = Omit<CreateGradeInput, "sortOrder"> & { sortOrder: number };
export type GradeReorderInput = { items: { id: number; sortOrder: number }[] };
