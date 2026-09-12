import type { Grade } from "@prisma/client";

export type DriveLinkStatus = "active" | "inactive" | "all";

export type DriveLinkSubject = {
  id: number;
  name: string;
  slug: string;
  grade: Grade;
  isActive: boolean;
};

export type DriveLinkRecord = {
  id: number;
  title: string;
  description: string | null;
  subjectId: number;
  driveUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subject: DriveLinkSubject;
};

export type DriveLinkWriteInput = {
  title: string;
  description: string | null;
  subjectId: number;
  driveUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export type PublicDriveLink = Pick<
  DriveLinkRecord,
  "id" | "title" | "description" | "driveUrl" | "sortOrder"
>;

export type DriveLinkOrderItem = {
  id: number;
  sortOrder: number;
};
