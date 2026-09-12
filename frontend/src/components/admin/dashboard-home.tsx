"use client";

import { useAdmin } from "./admin-context";

const sections = [
  { title: "الصفوف", description: "إدارة الصفوف الدراسية وترتيب ظهورها.", href: "/admin/dashboard/grades" },
  { title: "المواد", description: "تنظيم المواد وربطها بالصفوف الدراسية.", href: "/admin/dashboard/subjects" },
  { title: "الروابط", description: "إدارة وجهات Google Drive المعتمدة للمواد.", href: "/admin/dashboard/drive-links" },
  { title: "الإعلانات", description: "إدارة الإعلانات الظاهرة للطلاب.", href: null },
] as const;

export function DashboardHome() {
  const admin = useAdmin();
  const roleLabel = admin.role === "SUPER_ADMIN" ? "مدير عام" : "مدير";

  return (
    <div className="mx-auto max-w-6xl">
      <section className="rounded-[2rem] bg-[var(--sanabil-navy)] p-6 text-white shadow-[0_18px_60px_rgba(7,27,54,.14)] sm:p-9">
        <p className="font-bold text-[var(--sanabil-gold)]">مرحبًا بك</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{admin.name}</h1>
        <p className="mt-3 text-sm font-semibold text-slate-300">الدور: {roleLabel}</p>
        <p className="mt-5 max-w-2xl leading-8 text-slate-300">هذه مساحة إدارة منصة سنابل التعليمية. ستتوفر منها أدوات إدارة المحتوى تدريجيًا في المراحل القادمة.</p>
      </section>

      <section className="mt-8" aria-labelledby="management-sections-heading">
        <h2 id="management-sections-heading" className="text-xl font-black text-[var(--sanabil-navy)]">أقسام الإدارة</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(7,27,54,.05)]">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-extrabold text-[var(--sanabil-navy)]">{section.title}</h3>
                {section.href ? <a href={section.href} className="rounded-full bg-[var(--sanabil-gold)] px-3 py-1 text-xs font-bold text-[var(--sanabil-navy)]">فتح</a> : <span className="rounded-full bg-[var(--sanabil-gold-soft)] px-3 py-1 text-xs font-bold text-[var(--sanabil-navy)]">قريبًا</span>}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{section.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
