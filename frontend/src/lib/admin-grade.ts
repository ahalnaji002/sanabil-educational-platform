import type { Grade } from "../types/admin-subject";

export const gradeLabels: Record<Grade, string> = {
  TENTH: "عاشر",
  ELEVENTH: "حادي عشر",
  TAWJIHI: "توجيهي",
};

export const gradeOptions = (Object.entries(gradeLabels) as [Grade, string][]).map(
  ([value, label]) => ({ value, label }),
);

export function getGradeLabel(grade: Grade) {
  return gradeLabels[grade];
}
