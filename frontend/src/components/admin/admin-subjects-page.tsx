"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGradeService, AdminGradeError } from "../../services/admin-grade-service";
import { AdminSubjectError, adminSubjectService } from "../../services/admin-subject-service";
import type { AdminSubject, CreateSubjectInput, SubjectStatus } from "../../types/admin-subject";
import type { AdminGrade } from "../../types/grade";
import { SubjectFormModal } from "./subject-form-modal";

const statusOptions: { value: SubjectStatus; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "active", label: "النشطة" },
  { value: "inactive", label: "غير النشطة" },
];

function listErrorMessage(error: unknown) {
  if (error instanceof AdminSubjectError) {
    if (error.kind === "forbidden") return "لا تملك صلاحية إدارة المواد.";
    if (error.kind === "network") return "تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.";
    if (error.kind === "configuration") return "إعداد الاتصال بالخادم غير مكتمل.";
  }
  return "تعذر تحميل المواد. حاول مجددًا.";
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{active ? "نشط" : "غير نشط"}</span>;
}

function SubjectActions({ subject, busy, onEdit, onToggle, onManageLinks }: {
  subject: AdminSubject;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onManageLinks: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onEdit} disabled={busy} className="min-h-9 rounded-lg border border-slate-300 px-3 text-sm font-bold text-[var(--sanabil-navy)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)] disabled:opacity-50">تعديل</button>
      <button type="button" onClick={onManageLinks} disabled={busy} className="min-h-9 rounded-lg border border-[var(--sanabil-gold)] px-3 text-sm font-bold text-[var(--sanabil-navy)] disabled:opacity-50">إدارة الروابط</button>
      <button type="button" onClick={onToggle} disabled={busy} className={`min-h-9 rounded-lg px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)] disabled:opacity-50 ${subject.isActive ? "border border-red-200 bg-red-50 text-red-800" : "bg-emerald-700 text-white"}`}>{busy ? "جارٍ التنفيذ..." : subject.isActive ? "تعطيل" : "تفعيل"}</button>
    </div>
  );
}

export function AdminSubjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryGradeId = Number(searchParams.get("gradeId")) || undefined;
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [grades, setGrades] = useState<AdminGrade[]>([]);
  const [status, setStatus] = useState<SubjectStatus>("all");
  const [gradeId, setGradeId] = useState<number | undefined>(queryGradeId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<AdminSubject | null>(null);
  const [busySubjectId, setBusySubjectId] = useState<number | null>(null);

  useEffect(() => {
    adminGradeService.getGrades("all").then(setGrades).catch((requestError: unknown) => {
      if (requestError instanceof AdminGradeError && requestError.kind === "unauthorized") router.replace("/admin/login");
      else setError("تعذر تحميل قائمة الصفوف.");
    });
  }, [router]);

  useEffect(() => {
    let active = true;
    adminSubjectService.getSubjects({ status, ...(gradeId ? { gradeId } : {}) })
      .then((items) => {
        if (!active) return;
        setSubjects(items);
        setError(null);
        setLoading(false);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof AdminSubjectError && requestError.kind === "unauthorized") {
          router.replace("/admin/login");
          return;
        }
        setError(listErrorMessage(requestError));
        setLoading(false);
      });
    return () => { active = false; };
  }, [gradeId, router, status]);

  async function refreshSubjects() {
    const items = await adminSubjectService.getSubjects({ status, ...(gradeId ? { gradeId } : {}) });
    setSubjects(items);
    setError(null);
  }

  function handleUnauthorized(error: unknown) {
    if (error instanceof AdminSubjectError && error.kind === "unauthorized") {
      router.replace("/admin/login");
      return true;
    }
    return false;
  }

  async function handleSave(input: CreateSubjectInput) {
    if (editingSubject) await adminSubjectService.updateSubject(editingSubject.id, input);
    else await adminSubjectService.createSubject(input);
    await refreshSubjects();
    setFormOpen(false);
    setEditingSubject(null);
  }

  async function handleToggle(subject: AdminSubject) {
    if (subject.isActive && !window.confirm(`هل تريد تعطيل مادة «${subject.name}»؟ يمكن تفعيلها لاحقًا.`)) return;
    setBusySubjectId(subject.id);
    setError(null);
    try {
      if (subject.isActive) await adminSubjectService.deactivateSubject(subject.id);
      else await adminSubjectService.updateSubject(subject.id, { name: subject.name, slug: subject.slug, gradeId: subject.gradeId, isActive: true });
      await refreshSubjects();
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) setError(listErrorMessage(requestError));
    } finally {
      setBusySubjectId(null);
    }
  }

  function openCreateForm() {
    setEditingSubject(null);
    setFormOpen(true);
  }

  function openEditForm(subject: AdminSubject) {
    setEditingSubject(subject);
    setFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-bold text-[var(--sanabil-gold-dark)]">إدارة المحتوى</p>
          <h1 className="mt-1 text-3xl font-black text-[var(--sanabil-navy)]">المواد</h1>
          <p className="mt-2 text-sm leading-7 text-slate-600">أضف المواد وعدّل الصف والحالة والرابط المختصر لكل مادة.</p>
        </div>
        <button type="button" onClick={openCreateForm} className="min-h-11 rounded-xl bg-[var(--sanabil-navy)] px-5 font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)]">إضافة مادة</button>
      </div>

      <section aria-label="مرشحات المواد" className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-5">
        <div>
          <label htmlFor="subjects-status-filter" className="mb-2 block text-sm font-bold text-[var(--sanabil-navy)]">الحالة</label>
          <select id="subjects-status-filter" value={status} onChange={(event) => { setLoading(true); setStatus(event.target.value as SubjectStatus); }} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 focus:border-[var(--sanabil-gold)] focus:outline-none focus:ring-4 focus:ring-[var(--sanabil-gold)]/20">
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="subjects-grade-filter" className="mb-2 block text-sm font-bold text-[var(--sanabil-navy)]">الصف</label>
          <select id="subjects-grade-filter" value={gradeId ?? ""} onChange={(event) => { setLoading(true); setGradeId(event.target.value ? Number(event.target.value) : undefined); }} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 focus:border-[var(--sanabil-gold)] focus:outline-none focus:ring-4 focus:ring-[var(--sanabil-gold)]/20">
            <option value="">الكل</option>
            {grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
          </select>
        </div>
      </section>

      {error ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</p> : null}

      <section aria-live="polite" aria-busy={loading} className="mt-6">
        {loading ? <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-slate-600">جارٍ تحميل المواد...</p> : subjects.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center font-bold text-slate-600">لا توجد مواد مطابقة لهذه المرشحات.</p> : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
              <table className="w-full border-collapse text-right">
                <thead className="bg-slate-100 text-sm text-slate-700"><tr><th className="px-5 py-4">اسم المادة</th><th className="px-5 py-4">الصف</th><th className="px-5 py-4">slug</th><th className="px-5 py-4">الحالة</th><th className="px-5 py-4">الإجراءات</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {subjects.map((subject) => <tr key={subject.id}><td className="px-5 py-4 font-bold text-[var(--sanabil-navy)]">{subject.name}</td><td className="px-5 py-4 text-sm text-slate-700">{subject.grade.name}</td><td className="px-5 py-4"><code dir="ltr" className="text-xs text-slate-600">{subject.slug}</code></td><td className="px-5 py-4"><StatusBadge active={subject.isActive} /></td><td className="px-5 py-4"><SubjectActions subject={subject} busy={busySubjectId === subject.id} onEdit={() => openEditForm(subject)} onToggle={() => void handleToggle(subject)} onManageLinks={() => router.push(`/admin/dashboard/drive-links?subjectId=${String(subject.id)}`)} /></td></tr>)}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:hidden">
              {subjects.map((subject) => <article key={subject.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(7,27,54,.05)]"><div className="flex items-start justify-between gap-3"><div><h2 className="font-extrabold text-[var(--sanabil-navy)]">{subject.name}</h2><p className="mt-1 text-sm text-slate-600">{subject.grade.name}</p></div><StatusBadge active={subject.isActive} /></div><code dir="ltr" className="mt-4 block break-all rounded-lg bg-slate-100 px-3 py-2 text-left text-xs text-slate-600">{subject.slug}</code><div className="mt-4"><SubjectActions subject={subject} busy={busySubjectId === subject.id} onEdit={() => openEditForm(subject)} onToggle={() => void handleToggle(subject)} onManageLinks={() => router.push(`/admin/dashboard/drive-links?subjectId=${String(subject.id)}`)} /></div></article>)}
            </div>
          </>
        )}
      </section>

      {formOpen ? <SubjectFormModal key={editingSubject?.id ?? "new"} subject={editingSubject} grades={grades} onClose={() => { setFormOpen(false); setEditingSubject(null); }} onSave={handleSave} onUnauthorized={() => router.replace("/admin/login")} /> : null}
    </div>
  );
}
