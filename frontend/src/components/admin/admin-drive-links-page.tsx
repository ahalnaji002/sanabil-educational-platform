"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGradeError, adminGradeService } from "../../services/admin-grade-service";
import { AdminDriveLinkError, adminDriveLinkService } from "../../services/admin-drive-link-service";
import { AdminSubjectError, adminSubjectService } from "../../services/admin-subject-service";
import type { AdminDriveLink, CreateDriveLinkInput } from "../../types/admin-drive-link";
import type { AdminSubject, SubjectStatus } from "../../types/admin-subject";
import type { AdminGrade } from "../../types/grade";
import { DriveLinkFormModal } from "./drive-link-form-modal";

const statuses: { value: SubjectStatus; label: string }[] = [{ value: "all", label: "الكل" }, { value: "active", label: "النشطة" }, { value: "inactive", label: "غير النشطة" }];
const errorText = (error: unknown) => error instanceof AdminDriveLinkError && error.kind === "network" ? "تعذر الاتصال بالخادم. حاول مجددًا." : "تعذر تحميل الروابط. حاول مجددًا.";
const Badge = ({ active }: { active: boolean }) => <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{active ? "نشط" : "غير نشط"}</span>;

export function AdminDriveLinksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySubjectId = Number(searchParams.get("subjectId")) || undefined;
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [grades, setGrades] = useState<AdminGrade[]>([]);
  const [links, setLinks] = useState<AdminDriveLink[]>([]);
  const [subjectId, setSubjectId] = useState<number | undefined>(querySubjectId);
  const [gradeId, setGradeId] = useState<number | undefined>();
  const [status, setStatus] = useState<SubjectStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminDriveLink | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const selectedSubject = subjects.find(({ id }) => id === subjectId);
  const filteredSubjects = useMemo(
    () => gradeId ? subjects.filter((subject) => subject.gradeId === gradeId) : subjects,
    [gradeId, subjects],
  );

  const unauthorized = useCallback((requestError: unknown) => {
    if ((requestError instanceof AdminDriveLinkError || requestError instanceof AdminSubjectError) && requestError.kind === "unauthorized") { router.replace("/admin/login"); return true; }
    return false;
  }, [router]);

  useEffect(() => {
    adminSubjectService.getSubjects({ status: "all" }).then(setSubjects).catch((requestError: unknown) => { if (!unauthorized(requestError)) setError("تعذر تحميل قائمة المواد."); });
    adminGradeService.getGrades("all").then(setGrades).catch((requestError: unknown) => { if (!(requestError instanceof AdminGradeError && requestError.kind === "unauthorized")) setError("تعذر تحميل قائمة الصفوف."); else router.replace("/admin/login"); });
  }, [router, unauthorized]);

  const filters = useMemo(() => ({ status, ...(subjectId ? { subjectId } : {}), ...(gradeId ? { gradeId } : {}) }), [gradeId, status, subjectId]);
  const refresh = useCallback(async () => { const items = await adminDriveLinkService.getDriveLinks(filters); setLinks(items); setError(null); }, [filters]);
  useEffect(() => {
    let active = true;
    adminDriveLinkService.getDriveLinks(filters).then((items) => { if (active) { setLinks(items); setError(null); setLoading(false); } }).catch((requestError: unknown) => { if (!active) return; if (!unauthorized(requestError)) { setError(errorText(requestError)); setLoading(false); } });
    return () => { active = false; };
  }, [filters, unauthorized]);

  async function save(input: CreateDriveLinkInput) {
    if (editing) await adminDriveLinkService.updateDriveLink(editing.id, { ...input, sortOrder: input.sortOrder ?? editing.sortOrder });
    else await adminDriveLinkService.createDriveLink(input);
    await refresh(); setFormOpen(false); setEditing(null);
  }
  async function toggle(item: AdminDriveLink) {
    if (!window.confirm(item.isActive ? "تعطيل الرابط؟\n\nلن يظهر هذا الرابط للطلاب، لكنه سيبقى محفوظًا ويمكن تفعيله لاحقًا." : "تفعيل الرابط؟")) return;
    setBusyId(item.id);
    try { await adminDriveLinkService.updateDriveLinkStatus(item.id, !item.isActive); await refresh(); } catch (requestError) { if (!unauthorized(requestError)) setError("تعذر تحديث حالة الرابط."); } finally { setBusyId(null); }
  }
  async function remove(item: AdminDriveLink) {
    if (!window.confirm("حذف الرابط نهائيًا؟\n\nسيتم حذف هذا الرابط نهائيًا ولا يمكن التراجع عن العملية.")) return;
    setBusyId(item.id);
    try { await adminDriveLinkService.deleteDriveLink(item.id); await refresh(); } catch (requestError) { if (!unauthorized(requestError)) setError("تعذر حذف الرابط نهائيًا."); } finally { setBusyId(null); }
  }
  async function move(index: number, offset: -1 | 1) {
    if (!subjectId) return;
    const next = [...links];
    const target = index + offset;
    [next[index], next[target]] = [next[target]!, next[index]!];
    const ordered = next.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex + 1 }));
    setLinks(ordered); setReordering(true); setError(null);
    try { await adminDriveLinkService.reorderDriveLinks({ subjectId, items: ordered.map(({ id, sortOrder }) => ({ id, sortOrder })) }); await refresh(); }
    catch (requestError) { if (!unauthorized(requestError)) { setError("تعذر حفظ الترتيب، تمت استعادة ترتيب الخادم."); await refresh().catch(() => undefined); } }
    finally { setReordering(false); }
  }
  function changeGrade(nextGradeId: number | undefined) {
    setLoading(true);
    setGradeId(nextGradeId);
    if (nextGradeId && selectedSubject?.gradeId !== nextGradeId) setSubjectId(undefined);
  }
  const actions = (item: AdminDriveLink, index: number) => <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setEditing(item); setFormOpen(true); }} disabled={busyId === item.id} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">تعديل</button><button type="button" onClick={() => void toggle(item)} disabled={busyId === item.id} className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-bold">{item.isActive ? "تعطيل" : "تفعيل"}</button><button type="button" onClick={() => void remove(item)} disabled={busyId === item.id} className="rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white">حذف نهائي</button>{subjectId && status === "all" ? <><button type="button" aria-label="تحريك لأعلى" title="تحريك لأعلى" onClick={() => void move(index, -1)} disabled={index === 0 || reordering}>↑</button><button type="button" aria-label="تحريك لأسفل" title="تحريك لأسفل" onClick={() => void move(index, 1)} disabled={index === links.length - 1 || reordering}>↓</button></> : null}</div>;

  return <div className="mx-auto max-w-7xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-bold text-[var(--sanabil-gold-dark)]">إدارة المحتوى</p><h1 className="mt-1 text-3xl font-black text-[var(--sanabil-navy)]">الروابط التعليمية</h1><p className="mt-2 text-sm leading-7 text-slate-600">أدر روابط Google Drive الخاصة بكل مادة ورتّب ظهورها للطلاب.</p></div><button type="button" onClick={() => { setEditing(null); setFormOpen(true); }} disabled={!subjects.length} className="min-h-11 rounded-xl bg-[var(--sanabil-navy)] px-5 font-extrabold text-white disabled:opacity-50">إضافة رابط</button></div>
    <section aria-label="مرشحات الروابط" className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-3"><div><label htmlFor="links-grade" className="mb-2 block text-sm font-bold">الصف</label><select id="links-grade" value={gradeId ?? ""} onChange={(event) => changeGrade(event.target.value ? Number(event.target.value) : undefined)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4"><option value="">الكل</option>{grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}</select></div><div><label htmlFor="links-subject" className="mb-2 block text-sm font-bold">المادة</label><select id="links-subject" value={subjectId ?? ""} onChange={(event) => { setLoading(true); setSubjectId(event.target.value ? Number(event.target.value) : undefined); }} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4"><option value="">الكل</option>{filteredSubjects.map((subject) => <option key={subject.id} value={subject.id}>{gradeId ? subject.name : `${subject.name} — ${subject.grade.name}`}</option>)}</select></div><div><label htmlFor="links-status" className="mb-2 block text-sm font-bold">الحالة</label><select id="links-status" value={status} onChange={(event) => { setLoading(true); setStatus(event.target.value as SubjectStatus); }} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4">{statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></section>
    {selectedSubject ? <section className="mt-5 grid gap-3 rounded-2xl bg-[var(--sanabil-navy)] p-5 text-white sm:grid-cols-3"><p><span className="block text-xs text-slate-300">الصف</span><strong>{selectedSubject.grade.name}</strong></p><p><span className="block text-xs text-slate-300">حالة المادة</span><strong>{selectedSubject.isActive ? "نشطة" : "غير نشطة"}</strong></p><p><span className="block text-xs text-slate-300">عدد الروابط المطابقة</span><strong>{links.length}</strong></p></section> : null}
    {error ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-800">{error}</p> : null}
    <section aria-busy={loading} aria-live="polite" className="mt-6">{loading ? <p className="rounded-2xl bg-white p-8 text-center font-bold">جارٍ تحميل الروابط...</p> : links.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center font-bold text-slate-600">لا توجد روابط مطابقة لهذه المرشحات.</p> : <><div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block"><table className="w-full text-right text-sm"><thead className="bg-slate-100"><tr><th className="p-4">الترتيب</th><th className="p-4">العنوان</th><th className="p-4">الوصف</th><th className="p-4">المادة</th><th className="p-4">الحالة</th><th className="p-4">الرابط</th><th className="p-4">الإجراءات</th></tr></thead><tbody className="divide-y divide-slate-200">{links.map((item, index) => <tr key={item.id}><td className="p-4">{item.sortOrder}</td><td className="p-4 font-bold">{item.title}</td><td className="max-w-xs p-4 text-slate-600">{item.description || "—"}</td><td className="p-4">{item.subject.name}<span className="block text-xs text-slate-500">{item.subject.grade.name}</span></td><td className="p-4"><Badge active={item.isActive} /></td><td className="p-4"><a href={item.driveUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700">فتح الرابط</a></td><td className="p-4">{actions(item, index)}</td></tr>)}</tbody></table></div><div className="grid gap-4 lg:hidden">{links.map((item, index) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-extrabold">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.subject.name} — {item.subject.grade.name}</p></div><Badge active={item.isActive} /></div><p className="mt-3 text-sm text-slate-600">الترتيب: {item.sortOrder}</p>{item.description ? <p className="mt-3 break-words text-sm">{item.description}</p> : null}<a href={item.driveUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex font-bold text-blue-700">فتح الرابط</a><div className="mt-4">{actions(item, index)}</div></article>)}</div></>}</section>
    {formOpen ? <DriveLinkFormModal key={editing?.id ?? `new-${String(subjectId ?? 0)}`} driveLink={editing} subjects={subjects} initialSubjectId={subjectId} onClose={() => { setFormOpen(false); setEditing(null); }} onSave={save} onUnauthorized={() => router.replace("/admin/login")} /> : null}</div>;
}
