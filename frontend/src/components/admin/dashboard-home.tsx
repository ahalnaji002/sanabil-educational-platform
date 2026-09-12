"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdmin } from "./admin-context";
import { adminDashboardService, type DashboardSummary } from "../../services/admin-dashboard-service";

const sections = [
  { title: "الصفوف", description: "إدارة الصفوف الدراسية وترتيب ظهورها.", href: "/admin/dashboard/grades", count: "activeGrades" },
  { title: "المواد", description: "تنظيم المواد وربطها بالصفوف الدراسية.", href: "/admin/dashboard/subjects", count: "activeSubjects" },
  { title: "الروابط", description: "إدارة وجهات Google Drive المعتمدة للمواد.", href: "/admin/dashboard/drive-links", count: "activeDriveLinks" },
  { title: "الإعلانات", description: "إدارة الإعلانات الظاهرة للطلاب.", href: "/admin/dashboard/announcements", count: "activeAnnouncements" },
] as const;

function AnimatedAdminName({ name }: { name: string }) {
  const [animationFrame, setAnimationFrame] = useState({ text: "", isDeleting: false });
  const direction = /[\u0590-\u08ff]/u.test(name) ? "rtl" : "ltr";

  useEffect(() => {
    if (!name || (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      return;
    }

    const characters = Array.from(name);
    let visibleCharacters = 0;
    let isDeleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const updateName = () => {
      visibleCharacters += isDeleting ? -1 : 1;
      setAnimationFrame({
        text: characters.slice(0, visibleCharacters).join(""),
        isDeleting,
      });

      if (!isDeleting && visibleCharacters === characters.length) {
        isDeleting = true;
        timer = setTimeout(updateName, 1_200);
      } else if (isDeleting && visibleCharacters === 0) {
        isDeleting = false;
        timer = setTimeout(updateName, 450);
      } else {
        timer = setTimeout(updateName, isDeleting ? 80 : 120);
      }
    };

    timer = setTimeout(updateName, 120);
    return () => clearTimeout(timer);
  }, [name]);

  return (
    <h1 aria-label={name} className="mt-2 text-center text-3xl font-black sm:text-4xl" dir={direction}>
      <span aria-hidden="true" className="relative inline-block whitespace-nowrap" dir={direction}>
        <span className="opacity-0 motion-reduce:opacity-100">{name}</span>
        <span className="admin-name-live motion-reduce:hidden">
          <span
            className={!animationFrame.isDeleting && animationFrame.text ? "admin-name-smoke-cursor" : undefined}
            key={animationFrame.text}
          >
            {animationFrame.text}
          </span>
        </span>
      </span>
    </h1>
  );
}

export function DashboardHome() {
  const admin = useAdmin();
  const roleLabel = admin.role === "SUPER_ADMIN" ? "مدير عام" : "مدير";
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  useEffect(() => { let active = true; adminDashboardService.getSummary().then((value) => { if (active) setSummary(value); }).catch(() => { if (active) setSummaryError(true); }); return () => { active = false; }; }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <section className="rounded-[2rem] bg-[var(--sanabil-navy)] p-6 text-white shadow-[0_18px_60px_rgba(7,27,54,.14)] sm:p-9">
        <p className="font-bold text-[var(--sanabil-gold)]">مرحبًا بك</p>
        <AnimatedAdminName name={admin.name} />
        <p className="mt-3 text-sm font-semibold text-slate-300">الدور: {roleLabel}</p>
        <p className="mt-5 leading-8 text-slate-300 xl:whitespace-nowrap">هذه مساحة إدارة منصة سنابل التعليمية. ستتوفر منها أدوات إدارة المحتوى تدريجيًا في المراحل القادمة.</p>
      </section>

      <section className="mt-8" aria-labelledby="management-sections-heading">
        <h2 id="management-sections-heading" className="text-xl font-black text-[var(--sanabil-navy)]">أقسام الإدارة</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {sections.map((section) => {
            const content = (
              <>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-extrabold text-[var(--sanabil-navy)]">{section.title}</h3>
                  <span className="rounded-full bg-[var(--sanabil-gold-soft)] px-3 py-1 text-xs font-bold text-[var(--sanabil-navy)]">{summary ? `${String(summary[section.count])} نشط` : "…"}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{section.description}</p>
              </>
            );

            return (
              <Link
                key={section.title}
                href={section.href}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(7,27,54,.05)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sanabil-gold)] hover:shadow-[0_16px_40px_rgba(7,27,54,.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)] motion-reduce:transform-none motion-reduce:transition-none"
              >
                {content}
              </Link>
            );
          })}
        </div>
        {summaryError ? <p className="mt-4 text-sm font-semibold text-red-700">تعذر تحميل أعداد المحتوى النشط.</p> : null}
      </section>
    </div>
  );
}
