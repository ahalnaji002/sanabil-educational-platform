"use client";

import { useState } from "react";
import type { Grade, GradeId } from "@/types/grade";
import type { Subject } from "@/types/subject";
import { GradeSelector } from "./grade-selector";
import { SubjectCard } from "./subject-card";

type SubjectsSectionProps = {
  grades: readonly Grade[];
  subjects: readonly Subject[];
};

export function SubjectsSection({ grades, subjects }: SubjectsSectionProps) {
  const [selectedGradeId, setSelectedGradeId] = useState<GradeId | null>(null);
  const selectedGrade = grades.find((grade) => grade.id === selectedGradeId);
  const visibleSubjects = selectedGradeId
    ? subjects.filter((subject) => subject.gradeId === selectedGradeId)
    : [];

  return (
    <section id="subjects" className="section-reveal scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="font-bold text-[var(--sanabil-gold-dark)]">المواد التعليمية</p>
        <h2 className="mt-2 text-3xl font-black text-[var(--sanabil-navy)] sm:text-4xl">
          اختر صفك الدراسي
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          اختر صفك أولاً لتظهر المواد التعليمية المتاحة له.
        </p>

        <GradeSelector
          grades={grades}
          selectedGradeId={selectedGradeId}
          onSelect={setSelectedGradeId}
        />

        {selectedGrade ? (
          <div key={selectedGrade.id} className="grade-content-enter mt-10" aria-live="polite">
            <h3 className="text-2xl font-black text-[var(--sanabil-navy)]">
              مواد {selectedGrade.label}
            </h3>
            {visibleSubjects.length ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleSubjects.map((subject) => (
                  <SubjectCard key={subject.id} subject={subject} />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-[1.75rem] border border-dashed border-[var(--sanabil-gold)] bg-white px-6 py-12 text-center font-bold text-slate-600">
                سيتم إضافة مواد هذا الصف قريبًا
              </p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
