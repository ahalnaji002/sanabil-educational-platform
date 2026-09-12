import type { Grade as GradeCode } from "./admin-subject";

export type GradeId = GradeCode;

export type Grade = {
  id: GradeId;
  label: string;
};
