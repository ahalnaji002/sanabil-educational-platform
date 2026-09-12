"use client";

import Image from "next/image";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { resolveAnnouncementImageUrl } from "../../lib/api-client";
import { AdminAnnouncementError } from "../../services/admin-announcement-service";
import type { AdminAnnouncement, AnnouncementInput } from "../../types/announcement";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const localDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

type Props = { announcement: AdminAnnouncement | null; onClose: () => void; onSave: (input: AnnouncementInput) => Promise<void>; onUnauthorized: () => void };

export function AnnouncementFormModal({ announcement, onClose, onSave, onUnauthorized }: Props) {
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [content, setContent] = useState(announcement?.content ?? "");
  const [badge, setBadge] = useState(announcement?.badge ?? "");
  const [ctaLabel, setCtaLabel] = useState(announcement?.ctaLabel ?? "");
  const [ctaUrl, setCtaUrl] = useState(announcement?.ctaUrl ?? "");
  const [sortOrder, setSortOrder] = useState(String(announcement?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(announcement?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(localDate(announcement?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(localDate(announcement?.endsAt ?? null));
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewObjectUrl = useRef<string | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => () => { if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current); }, []);

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", escape); document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", escape); document.body.style.overflow = ""; previousFocus.current?.focus(); };
  }, [onClose, submitting]);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const nextImage = event.target.files?.[0] ?? null;
    if (!nextImage) { setImage(null); return; }
    if (!acceptedImageTypes.has(nextImage.type)) {
      setErrors((current) => ({ ...current, image: "اختر صورة بصيغة JPEG أو PNG أو WebP." })); event.target.value = ""; return;
    }
    if (nextImage.size > MAX_IMAGE_BYTES) {
      setErrors((current) => ({ ...current, image: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت." })); event.target.value = ""; return;
    }
    setErrors((current) => { const next = { ...current }; delete next.image; return next; });
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    previewObjectUrl.current = URL.createObjectURL(nextImage);
    setImagePreview(previewObjectUrl.current); setImage(nextImage); setRemoveImage(false);
  }

  function clearImage() {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    previewObjectUrl.current = null;
    setImagePreview(null); setImage(null); setRemoveImage(Boolean(announcement?.imageUrl));
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {}; const order = Number(sortOrder);
    const cleanTitle = title.trim(); const cleanContent = content.trim(); const cleanLabel = ctaLabel.trim(); const cleanUrl = ctaUrl.trim();
    if (!cleanTitle) next.title = "العنوان مطلوب."; if (!cleanContent) next.content = "المحتوى مطلوب.";
    if (!Number.isInteger(order) || order < 0) next.sortOrder = "الترتيب يجب أن يكون عددًا صحيحًا غير سالب.";
    if (Boolean(cleanLabel) !== Boolean(cleanUrl)) next.cta = "يجب إدخال نص الزر والرابط معًا.";
    if (cleanUrl) { try { if (new URL(cleanUrl).protocol !== "https:") next.ctaUrl = "الرابط يجب أن يستخدم HTTPS."; } catch { next.ctaUrl = "الرابط غير صالح."; } }
    if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) next.endsAt = "تاريخ النهاية يجب ألا يسبق البداية.";
    if (Object.keys(next).length) { setErrors(next); return; }
    setSubmitting(true); setErrors({});
    try {
      await onSave({ title: cleanTitle, content: cleanContent, badge: badge.trim() || null, ctaLabel: cleanLabel || null, ctaUrl: cleanUrl || null, sortOrder: order, isActive, startsAt: startsAt ? new Date(startsAt).toISOString() : null, endsAt: endsAt ? new Date(endsAt).toISOString() : null, image, removeImage });
    } catch (error) {
      if (error instanceof AdminAnnouncementError && error.kind === "unauthorized") { onUnauthorized(); return; }
      setErrors(error instanceof AdminAnnouncementError && error.kind === "validation" ? { ...error.fields, form: "تحقق من البيانات المدخلة." } : { form: "تعذر حفظ الإعلان. حاول مجددًا." }); setSubmitting(false);
    }
  }

  const fieldClass = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)]";
  const existingImageUrl = removeImage ? null : resolveAnnouncementImageUrl(announcement?.imageUrl ?? null);
  const previewUrl = imagePreview ?? existingImageUrl;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="announcement-form-title" className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl sm:p-8">
    <div className="flex justify-between gap-4"><div><p className="font-bold text-[var(--sanabil-gold-dark)]">إدارة الإعلانات</p><h2 id="announcement-form-title" className="mt-1 text-2xl font-black">{announcement ? "تعديل الإعلان" : "إضافة إعلان"}</h2></div><button type="button" onClick={onClose} disabled={submitting} aria-label="إغلاق النموذج" className="size-10 rounded-xl border border-slate-200 text-xl">×</button></div>
    <form onSubmit={submit} noValidate className="mt-6 space-y-4">
      <div><label htmlFor="announcement-title" className="mb-2 block font-bold">العنوان</label><input id="announcement-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} />{errors.title ? <p className="mt-1 text-sm text-red-700">{errors.title}</p> : null}</div>
      <div><label htmlFor="announcement-content" className="mb-2 block font-bold">المحتوى</label><textarea id="announcement-content" rows={5} value={content} onChange={(event) => setContent(event.target.value)} className={`${fieldClass} py-3`} />{errors.content ? <p className="mt-1 text-sm text-red-700">{errors.content}</p> : null}</div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="announcement-badge" className="mb-2 block font-bold">الشارة</label><input id="announcement-badge" value={badge} onChange={(event) => setBadge(event.target.value)} className={fieldClass} /></div><div><label htmlFor="announcement-order" className="mb-2 block font-bold">الترتيب</label><input id="announcement-order" type="number" min="0" step="1" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className={fieldClass} />{errors.sortOrder ? <p className="mt-1 text-sm text-red-700">{errors.sortOrder}</p> : null}</div><div><label htmlFor="announcement-cta-label" className="mb-2 block font-bold">نص الزر</label><input id="announcement-cta-label" value={ctaLabel} onChange={(event) => setCtaLabel(event.target.value)} className={fieldClass} /></div><div><label htmlFor="announcement-cta-url" className="mb-2 block font-bold">رابط الزر</label><input id="announcement-cta-url" dir="ltr" value={ctaUrl} onChange={(event) => setCtaUrl(event.target.value)} className={`${fieldClass} text-left`} />{errors.ctaUrl || errors.cta ? <p className="mt-1 text-sm text-red-700">{errors.ctaUrl ?? errors.cta}</p> : null}</div><div><label htmlFor="announcement-start" className="mb-2 block font-bold">تاريخ البداية</label><input id="announcement-start" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={fieldClass} /></div><div><label htmlFor="announcement-end" className="mb-2 block font-bold">تاريخ النهاية</label><input id="announcement-end" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className={fieldClass} />{errors.endsAt ? <p className="mt-1 text-sm text-red-700">{errors.endsAt}</p> : null}</div><div><label htmlFor="announcement-active" className="mb-2 block font-bold">الحالة</label><select id="announcement-active" value={isActive ? "active" : "inactive"} onChange={(event) => setIsActive(event.target.value === "active")} className={fieldClass}><option value="active">نشط</option><option value="inactive">غير نشط</option></select></div></div>
      <div className="rounded-2xl border border-slate-200 p-4"><label htmlFor="announcement-image" className="block font-bold">صورة الإعلان <span className="text-sm font-normal text-slate-500">(اختياري)</span></label><p className="mt-1 text-sm text-slate-500">JPEG أو PNG أو WebP، بحد أقصى 5 ميجابايت.</p>{previewUrl ? <div className="relative mt-3 h-36 overflow-hidden rounded-xl bg-slate-100">{imagePreview ? <div role="img" aria-label="معاينة صورة الإعلان" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imagePreview})` }} /> : <Image src={previewUrl} alt="صورة الإعلان الحالية" fill unoptimized={previewUrl.startsWith("http")} sizes="(min-width: 640px) 36rem, 100vw" className="object-contain" />}</div> : null}<div className="mt-3 flex flex-wrap items-center gap-3"><input ref={fileInput} id="announcement-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} className="block max-w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-[var(--sanabil-gold-soft)] file:px-4 file:py-2 file:font-bold" />{previewUrl ? <button type="button" onClick={clearImage} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700">إزالة الصورة</button> : null}</div>{errors.image ? <p className="mt-2 text-sm text-red-700">{errors.image}</p> : null}</div>
      {errors.form ? <p role="alert" className="rounded-xl bg-red-50 p-3 font-semibold text-red-800">{errors.form}</p> : null}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={submitting} className="min-h-11 rounded-xl border border-slate-300 px-5 font-bold">إلغاء</button><button type="submit" disabled={submitting} className="min-h-11 rounded-xl bg-[var(--sanabil-navy)] px-6 font-extrabold text-white disabled:opacity-60">{submitting ? "جارٍ الحفظ..." : "حفظ"}</button></div>
    </form></section></div>;
}
