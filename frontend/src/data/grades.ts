import type { Grade } from "@/types/grade";

export const localGrades: readonly Grade[] = [
  { id: "TENTH", label: "عاشر" },
  { id: "ELEVENTH", label: "حادي عشر" },
  { id: "TAWJIHI", label: "توجيهي" },
] as const;
