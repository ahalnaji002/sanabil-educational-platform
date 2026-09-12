"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { AdminGradeError } from "../../services/admin-grade-service";
import type { AdminGrade, CreateGradeInput } from "../../types/grade";

type Props = { grade: AdminGrade | null; onClose: () => void; onSave: (input: CreateGradeInput) => Promise<void>; onUnauthorized: () => void };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function GradeFormModal({ grade, onClose, onSave, onUnauthorized }: Props) {
  const [name, setName] = useState(grade?.name ?? "");
  const [slug, setSlug] = useState(grade?.slug ?? "");
  const [sortOrder, setSortOrder] = useState(grade ? String(grade.sortOrder) : "");
  const [isActive, setIsActive] = useState(grade?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !submitting) onClose(); }; window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape); }, [onClose, submitting]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitting) return;
    const next: Record<string, string> = {}; const normalizedName = name.trim(); const normalizedSlug = slug.trim().toLowerCase(); const parsedOrder = sortOrder === "" ? undefined : Number(sortOrder);
    if (!normalizedName) next.name = "اسم الصف مطلوب."; else if (normalizedName.length > 120) next.name = "اسم الصف طويل جدًا.";
    if (!normalizedSlug) next.slug = "الرابط المختصر مطلوب."; else if (!slugPattern.test(normalizedSlug)) next.slug = "استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات مفردة فقط.";
    if (parsedOrder !== undefined && (!Number.isInteger(parsedOrder) || parsedOrder < 0)) next.sortOrder = "الترتيب يجب أن يكون عددًا صحيحًا غير سالب.";
    if (Object.keys(next).length) { setErrors(next); return; }
    setSubmitting(true); setErrors({});
    try { await onSave({ name: normalizedName, slug: normalizedSlug, ...(parsedOrder === undefined ? {} : { sortOrder: parsedOrder }), isActive }); }
    catch (error) {
      if (error instanceof AdminGradeError) {
        if (error.kind === "unauthorized") { onUnauthorized(); return; }
        if (error.kind === "conflict" || error.fields.slug) setErrors({ slug: "هذا الرابط المختصر مستخدم لصف آخر." });
        else if (error.kind === "validation") setErrors({ form: "تحقق من البيانات المدخلة." });
        else setErrors({ form: "تعذر حفظ الصف. حاول مجددًا." });
      } else setErrors({ form: "تعذر حفظ الصف. حاول مجددًا." });
      setSubmitting(false);
    }
  }
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-8" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="grade-form-title" className="max-h-full w-full max-w-xl overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-2xl sm:p-8"><div className="flex justify-between gap-4"><div><p className="text-sm font-bold text-[var(--sanabil-gold-dark)]">إدارة الصفوف</p><h2 id="grade-form-title" className="mt-1 text-2xl font-black">{grade ? "تعديل الصف" : "إضافة صف"}</h2></div><button type="button" aria-label="إغلاق النموذج" disabled={submitting} onClick={onClose} className="size-10 rounded-xl border border-slate-200 text-xl">×</button></div><form onSubmit={submit} noValidate className="mt-6 space-y-5"><div><label htmlFor="grade-name" className="mb-2 block text-sm font-bold">اسم الصف</label><input id="grade-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} disabled={submitting} className="min-h-11 w-full rounded-xl border border-slate-300 px-4" />{errors.name ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.name}</p> : null}</div><div><label htmlFor="grade-slug" className="mb-2 block text-sm font-bold">الرابط المختصر (slug)</label><input id="grade-slug" dir="ltr" value={slug} onChange={(event) => setSlug(event.target.value)} disabled={submitting} className="min-h-11 w-full rounded-xl border border-slate-300 px-4 text-left" />{errors.slug ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.slug}</p> : null}</div><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="grade-order" className="mb-2 block text-sm font-bold">الترتيب</label><input id="grade-order" type="number" min="0" step="1" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} disabled={submitting} placeholder="تلقائي" className="min-h-11 w-full rounded-xl border border-slate-300 px-4" />{errors.sortOrder ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.sortOrder}</p> : null}</div><div><label htmlFor="grade-active" className="mb-2 block text-sm font-bold">الحالة</label><select id="grade-active" value={isActive ? "active" : "inactive"} onChange={(event) => setIsActive(event.target.value === "active")} disabled={submitting} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4"><option value="active">نشط</option><option value="inactive">غير نشط</option></select></div></div>{errors.form ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{errors.form}</p> : null}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={submitting} className="min-h-11 rounded-xl border border-slate-300 px-5 font-bold">إلغاء</button><button type="submit" disabled={submitting} className="min-h-11 rounded-xl bg-[var(--sanabil-navy)] px-6 font-extrabold text-white disabled:opacity-60">{submitting ? "جارٍ الحفظ..." : grade ? "حفظ التعديلات" : "إضافة الصف"}</button></div></form></section></div>;
}
