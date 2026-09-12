"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicGrade } from "@/types/grade";
import { publicContentService } from "../services/public-content-service";
import type { PublicSubject } from "@/types/public-content";
import { GradeSelector } from "./grade-selector";
import { SubjectCard } from "./subject-card";

export function SubjectsSection() {
  const [grades, setGrades] = useState<PublicGrade[]>([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [gradesError, setGradesError] = useState(false);
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<PublicSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const cache = useRef(new Map<string, PublicSubject[]>());
  const selectedGrade = grades.find((grade) => grade.id === selectedGradeId);

  useEffect(() => {
    let active = true;
    publicContentService.getPublicGrades().then((items) => { if (active) { setGrades(items); setGradesError(false); setGradesLoading(false); } }).catch(() => { if (active) { setGradesError(true); setGradesLoading(false); } });
    return () => { active = false; };
  }, []);

  async function selectGrade(gradeId: number) {
    const grade = grades.find((item) => item.id === gradeId);
    if (!grade) return;
    setSelectedGradeId(gradeId);
    setLoading(true);
    setError(null);
    const cached = cache.current.get(grade.slug);
    if (cached) {
      setSubjects(cached);
      setLoading(false);
      return;
    }
    setSubjects([]);
    const currentRequest = ++requestId.current;
    try {
      const items = await publicContentService.getPublicSubjects(grade.slug);
      cache.current.set(grade.slug, items);
      if (currentRequest === requestId.current) setSubjects(items);
    } catch {
      if (currentRequest === requestId.current) setError("تعذر تحميل المواد حاليًا. حاول مجددًا.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

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

        {gradesLoading ? <p className="mt-8 font-bold text-slate-600">جارٍ تحميل الصفوف...</p> : gradesError ? <p role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-800">تعذر تحميل الصفوف حاليًا. حاول مجددًا.</p> : grades.length ? <GradeSelector grades={grades} selectedGradeId={selectedGradeId} onSelect={(gradeId) => void selectGrade(gradeId)} /> : <p className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center font-bold text-slate-600">لا توجد صفوف متاحة حاليًا.</p>}

        {selectedGrade ? (
          <div key={selectedGrade.id} className="grade-content-enter mt-10" aria-live="polite">
            <h3 className="text-2xl font-black text-[var(--sanabil-navy)]">
              مواد {selectedGrade.name}
            </h3>
            {loading ? (
              <p className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white px-6 py-12 text-center font-bold text-slate-600">جارٍ تحميل المواد...</p>
            ) : error ? (
              <p role="alert" className="mt-6 rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-12 text-center font-bold text-red-800">{error}</p>
            ) : subjects.length ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                  <SubjectCard key={subject.id} subject={subject} />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-[1.75rem] border border-dashed border-[var(--sanabil-gold)] bg-white px-6 py-12 text-center font-bold text-slate-600">
                لا توجد مواد متاحة لهذا الصف حاليًا.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
