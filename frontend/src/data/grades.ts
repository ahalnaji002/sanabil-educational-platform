import type { Grade } from "@/types/grade";

export const localGrades: readonly Grade[] = [
  { id: "tenth", label: "عاشر" },
  { id: "eleventh", label: "حادي عشر" },
  { id: "tawjihi", label: "توجيهي" },
] as const;
