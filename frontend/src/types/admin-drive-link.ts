import type { AdminSubject, Grade, SubjectStatus } from "./admin-subject";

export type AdminDriveLink = {
  id: number;
  title: string;
  description: string | null;
  subjectId: number;
  driveUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subject: Pick<AdminSubject, "id" | "name" | "slug" | "grade" | "isActive">;
};

export type CreateDriveLinkInput = {
  title: string;
  description: string | null;
  subjectId: number;
  driveUrl: string;
  sortOrder?: number;
  isActive: boolean;
};

export type UpdateDriveLinkInput = Omit<CreateDriveLinkInput, "sortOrder"> & { sortOrder: number };
export type DriveLinkFilters = { status: SubjectStatus; subjectId?: number; grade?: Grade };
export type DriveLinkReorderInput = { subjectId: number; items: { id: number; sortOrder: number }[] };
