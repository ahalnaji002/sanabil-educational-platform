"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { gradeOptions } from "../../lib/admin-grade";
import { AdminSubjectError } from "../../services/admin-subject-service";
import type { AdminSubject, CreateSubjectInput, Grade } from "../../types/admin-subject";

type SubjectFormModalProps = {
  subject: AdminSubject | null;
  onClose: () => void;
  onSave: (input: CreateSubjectInput) => Promise<void>;
  onUnauthorized: () => void;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function SubjectFormModal({ subject, onClose, onSave, onUnauthorized }: SubjectFormModalProps) {
  const [name, setName] = useState(subject?.name ?? "");
  const [slug, setSlug] = useState(subject?.slug ?? "");
  const [grade, setGrade] = useState<Grade>(subject?.grade ?? "TAWJIHI");
  const [isActive, setIsActive] = useState(subject?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, submitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const normalizedName = name.trim();
    const normalizedSlug = slug.trim().toLowerCase();
    const nextErrors: Record<string, string> = {};
    if (!normalizedName) nextErrors.name = "اسم المادة مطلوب.";
    else if (normalizedName.length > 120) nextErrors.name = "اسم المادة طويل جدًا.";
    if (!normalizedSlug) nextErrors.slug = "الرابط المختصر مطلوب.";
    else if (!slugPattern.test(normalizedSlug)) nextErrors.slug = "استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات مفردة فقط.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      await onSave({ name: normalizedName, slug: normalizedSlug, grade, isActive });
    } catch (error) {
      if (error instanceof AdminSubjectError) {
        if (error.kind === "unauthorized") {
          onUnauthorized();
          return;
        }
        if (error.kind === "conflict" || error.fields.slug) {
          setErrors({ slug: "هذا الرابط المختصر مستخدم لمادة أخرى." });
        } else if (error.kind === "validation") {
          setErrors({ form: "تحقق من البيانات المدخلة وحاول مجددًا." });
        } else if (error.kind === "network") {
          setErrors({ form: "تعذر الاتصال بالخادم. حاول مجددًا." });
        } else {
          setErrors({ form: "تعذر حفظ المادة. حاول مجددًا." });
        }
      } else {
        setErrors({ form: "تعذر حفظ المادة. حاول مجددًا." });
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-8" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="subject-form-title" className="max-h-full w-full max-w-xl overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--sanabil-gold-dark)]">إدارة المواد</p>
            <h2 id="subject-form-title" className="mt-1 text-2xl font-black text-[var(--sanabil-navy)]">{subject ? "تعديل المادة" : "إضافة مادة"}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="إغلاق النموذج" className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-xl text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)] disabled:opacity-50">×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <div>
            <label htmlFor="subject-name" className="mb-2 block text-sm font-bold text-[var(--sanabil-navy)]">اسم المادة</label>
            <input id="subject-name" value={name} onChange={(event) => setName(event.target.value)} disabled={submitting} autoFocus aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "subject-name-error" : undefined} className="min-h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-[var(--sanabil-gold)] focus:ring-4 focus:ring-[var(--sanabil-gold)]/20" />
            {errors.name ? <p id="subject-name-error" className="mt-2 text-sm font-semibold text-red-700">{errors.name}</p> : null}
          </div>
          <div>
            <label htmlFor="subject-slug" className="mb-2 block text-sm font-bold text-[var(--sanabil-navy)]">الرابط المختصر (slug)</label>
            <input id="subject-slug" dir="ltr" value={slug} onChange={(event) => setSlug(event.target.value)} disabled={submitting} aria-invalid={Boolean(errors.slug)} aria-describedby={errors.slug ? "subject-slug-error" : undefined} className="min-h-11 w-full rounded-xl border border-slate-300 px-4 text-left outline-none focus:border-[var(--sanabil-gold)] focus:ring-4 focus:ring-[var(--sanabil-gold)]/20" />
            {errors.slug ? <p id="subject-slug-error" className="mt-2 text-sm font-semibold text-red-700">{errors.slug}</p> : null}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="subject-grade" className="mb-2 block text-sm font-bold text-[var(--sanabil-navy)]">الصف</label>
              <select id="subject-grade" value={grade} onChange={(event) => setGrade(event.target.value as Grade)} disabled={submitting} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-[var(--sanabil-gold)] focus:ring-4 focus:ring-[var(--sanabil-gold)]/20">
                {gradeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="subject-status" className="mb-2 block text-sm font-bold text-[var(--sanabil-navy)]">الحالة</label>
              <select id="subject-status" value={isActive ? "active" : "inactive"} onChange={(event) => setIsActive(event.target.value === "active")} disabled={submitting} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-[var(--sanabil-gold)] focus:ring-4 focus:ring-[var(--sanabil-gold)]/20">
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>

          {errors.form ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{errors.form}</p> : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={submitting} className="min-h-11 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)] disabled:opacity-50">إلغاء</button>
            <button type="submit" disabled={submitting} className="min-h-11 rounded-xl bg-[var(--sanabil-navy)] px-6 font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "جارٍ الحفظ..." : subject ? "حفظ التعديلات" : "إضافة المادة"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
