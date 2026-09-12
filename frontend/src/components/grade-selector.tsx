import type { PublicGrade } from "@/types/grade";

type GradeSelectorProps = {
  grades: readonly PublicGrade[];
  selectedGradeId: number | null;
  onSelect: (gradeId: number) => void;
};

export function GradeSelector({ grades, selectedGradeId, onSelect }: GradeSelectorProps) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-2 sm:max-w-2xl sm:grid-cols-3 sm:gap-4" aria-label="الصف الدراسي">
      {grades.map((grade) => {
        const isSelected = grade.id === selectedGradeId;

        return (
          <button
            key={grade.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(grade.id)}
            className={`min-h-14 rounded-2xl border px-2 py-3 text-sm font-extrabold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)] sm:px-5 sm:text-base ${
              isSelected
                ? "border-[var(--sanabil-gold)] bg-[var(--sanabil-navy)] text-[var(--sanabil-gold)] shadow-[0_10px_30px_rgba(7,27,54,.16)]"
                : "border-slate-200 bg-white text-[var(--sanabil-navy)] hover:border-[var(--sanabil-gold)] hover:bg-[var(--sanabil-gold-soft)]"
            }`}
          >
            {grade.name}
          </button>
        );
      })}
    </div>
  );
}
