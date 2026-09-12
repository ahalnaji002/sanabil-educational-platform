"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { AdminDriveLinkError } from "../../services/admin-drive-link-service";
import type { AdminDriveLink, CreateDriveLinkInput } from "../../types/admin-drive-link";
import type { AdminSubject } from "../../types/admin-subject";
import { getGradeLabel } from "../../lib/admin-grade";

type Props = {
  driveLink: AdminDriveLink | null;
  subjects: AdminSubject[];
  initialSubjectId?: number | undefined;
  onClose: () => void;
  onSave: (input: CreateDriveLinkInput & { sortOrder?: number }) => Promise<void>;
  onUnauthorized: () => void;
};

function isGoogleDriveUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && url.hostname.toLowerCase() === "drive.google.com"; } catch { return false; }
}

export function DriveLinkFormModal({ driveLink, subjects, initialSubjectId, onClose, onSave, onUnauthorized }: Props) {
  const [subjectId, setSubjectId] = useState(driveLink?.subjectId ?? initialSubjectId ?? subjects[0]?.id ?? 0);
  const [title, setTitle] = useState(driveLink?.title ?? "");
  const [description, setDescription] = useState(driveLink?.description ?? "");
  const [driveUrl, setDriveUrl] = useState(driveLink?.driveUrl ?? "");
  const [sortOrder, setSortOrder] = useState(driveLink ? String(driveLink.sortOrder) : "");
  const [isActive, setIsActive] = useState(driveLink?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onClose, submitting]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const nextErrors: Record<string, string> = {};
    if (!subjectId) nextErrors.subjectId = "اختر المادة.";
    if (!title.trim()) nextErrors.title = "عنوان الرابط مطلوب.";
    else if (title.trim().length > 160) nextErrors.title = "عنوان الرابط طويل جدًا.";
    if (!isGoogleDriveUrl(driveUrl.trim())) nextErrors.driveUrl = "أدخل رابط HTTPS صحيحًا من drive.google.com.";
    const parsedOrder = sortOrder === "" ? undefined : Number(sortOrder);
    if (parsedOrder !== undefined && (!Number.isInteger(parsedOrder) || parsedOrder < 0)) nextErrors.sortOrder = "الترتيب يجب أن يكون عددًا صحيحًا غير سالب.";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    setSubmitting(true);
    setErrors({});
    try {
      await onSave({ title: title.trim(), description: description.trim() || null, subjectId, driveUrl: driveUrl.trim(), ...(parsedOrder === undefined ? {} : { sortOrder: parsedOrder }), isActive });
    } catch (error) {
      if (error instanceof AdminDriveLinkError) {
        if (error.kind === "unauthorized") { onUnauthorized(); return; }
        if (error.kind === "validation") setErrors({ form: "تحقق من البيانات المدخلة ورابط Google Drive." });
        else if (error.kind === "network") setErrors({ form: "تعذر الاتصال بالخادم. حاول مجددًا." });
        else setErrors({ form: "تعذر حفظ الرابط. حاول مجددًا." });
      } else setErrors({ form: "تعذر حفظ الرابط. حاول مجددًا." });
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-8" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="drive-link-form-title" className="max-h-full w-full max-w-2xl overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-[var(--sanabil-gold-dark)]">إدارة الروابط</p><h2 id="drive-link-form-title" className="mt-1 text-2xl font-black text-[var(--sanabil-navy)]">{driveLink ? "تعديل الرابط" : "إضافة رابط"}</h2></div><button type="button" onClick={onClose} disabled={submitting} aria-label="إغلاق النموذج" className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-xl">×</button></div>
        <form onSubmit={submit} noValidate className="mt-6 space-y-5">
          <div><label htmlFor="drive-link-subject" className="mb-2 block text-sm font-bold">المادة *</label><select id="drive-link-subject" value={subjectId || ""} onChange={(event) => setSubjectId(Number(event.target.value))} disabled={submitting} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4"><option value="">اختر المادة</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} — {getGradeLabel(subject.grade)}</option>)}</select>{errors.subjectId ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.subjectId}</p> : null}</div>
          <div><label htmlFor="drive-link-title" className="mb-2 block text-sm font-bold">عنوان الرابط *</label><input id="drive-link-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} disabled={submitting} className="min-h-11 w-full rounded-xl border border-slate-300 px-4" />{errors.title ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.title}</p> : null}</div>
          <div><label htmlFor="drive-link-description" className="mb-2 block text-sm font-bold">الوصف</label><textarea id="drive-link-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={submitting} rows={3} className="w-full rounded-xl border border-slate-300 px-4 py-3" /></div>
          <div><label htmlFor="drive-link-url" className="mb-2 block text-sm font-bold">رابط Google Drive *</label><input id="drive-link-url" dir="ltr" value={driveUrl} onChange={(event) => setDriveUrl(event.target.value)} disabled={submitting} placeholder="https://drive.google.com/..." className="min-h-11 w-full rounded-xl border border-slate-300 px-4 text-left" />{errors.driveUrl ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.driveUrl}</p> : null}</div>
          <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="drive-link-order" className="mb-2 block text-sm font-bold">الترتيب</label><input id="drive-link-order" type="number" min="0" step="1" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} disabled={submitting} placeholder="تلقائي" className="min-h-11 w-full rounded-xl border border-slate-300 px-4" />{errors.sortOrder ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.sortOrder}</p> : null}</div><div><label htmlFor="drive-link-status" className="mb-2 block text-sm font-bold">الحالة</label><select id="drive-link-status" value={isActive ? "active" : "inactive"} onChange={(event) => setIsActive(event.target.value === "active")} disabled={submitting} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4"><option value="active">نشط</option><option value="inactive">غير نشط</option></select></div></div>
          {errors.form ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{errors.form}</p> : null}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={submitting} className="min-h-11 rounded-xl border border-slate-300 px-5 font-bold">إلغاء</button><button type="submit" disabled={submitting} className="min-h-11 rounded-xl bg-[var(--sanabil-navy)] px-6 font-extrabold text-white disabled:opacity-60">{submitting ? "جارٍ الحفظ..." : driveLink ? "حفظ التعديلات" : "إضافة الرابط"}</button></div>
        </form>
      </section>
    </div>
  );
}
