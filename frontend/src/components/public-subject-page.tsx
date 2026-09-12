"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { publicContentService, PublicContentError } from "../services/public-content-service";
import type { PublicDriveLinksResult, PublicSubject } from "@/types/public-content";
import { DestinationCard } from "./destination-card";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SubjectQuickNavigation } from "./subject-quick-navigation";
import { SubjectScrollReset } from "./subject-scroll-reset";

export function PublicSubjectPage({ slug }: { slug: string }) {
  const [content, setContent] = useState<PublicDriveLinksResult | null>(null);
  const [subjects, setSubjects] = useState<PublicSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not-found" | "unavailable" | null>(null);

  useEffect(() => {
    let active = true;
    publicContentService.getPublicDriveLinks(slug)
      .then(async (result) => {
        if (!active) return;
        setContent(result);
        setError(null);
        setLoading(false);
        try {
          const gradeSubjects = await publicContentService.getPublicSubjects(result.subject.grade.slug);
          if (active) setSubjects(gradeSubjects);
        } catch {
          // Quick navigation is optional; available Drive Links remain usable.
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof PublicContentError && requestError.kind === "not-found" ? "not-found" : "unavailable");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  return (
    <>
      <SubjectScrollReset />
      <SiteHeader />
      <main className="min-h-[calc(100vh-180px)] bg-[var(--sanabil-cream)]">
        {loading ? <p className="mx-auto max-w-5xl px-5 py-24 text-center font-bold text-slate-600">جارٍ تحميل المادة...</p> : error ? (
          <section className="mx-auto max-w-3xl px-5 py-24 text-center">
            <h1 className="text-3xl font-black text-[var(--sanabil-navy)]">{error === "not-found" ? "المادة غير متاحة" : "تعذر تحميل المادة"}</h1>
            <p role="alert" className="mt-4 text-slate-600">{error === "not-found" ? "قد تكون المادة غير موجودة أو غير مفعلة حاليًا." : "تعذر الاتصال بالخادم. حاول مجددًا بعد قليل."}</p>
            <Link href="/#subjects" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-[var(--sanabil-navy)] px-5 font-bold text-white">العودة إلى المواد</Link>
          </section>
        ) : content ? (
          <>
            <section className="bg-[var(--sanabil-navy)] px-5 pb-16 pt-10 text-white sm:px-8 sm:pb-20">
              <div className="mx-auto max-w-5xl">
                <nav aria-label="مسار التنقل" className="text-sm text-slate-300"><Link href="/" className="hover:text-white">الرئيسية</Link><span className="mx-2">/</span><span>{content.subject.name}</span></nav>
                <p className="mt-10 font-bold text-[var(--sanabil-gold)]">وجهات المادة</p>
                <h1 className="mt-2 text-4xl font-black sm:text-5xl">{content.subject.name}</h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">اختر الرابط المناسب ثم تابع التصفح داخل Google Drive.</p>
              </div>
            </section>
            <section className="px-5 py-10 sm:px-8 sm:py-14">
              <div className="mx-auto max-w-5xl space-y-5">
                {content.driveLinks.length ? content.driveLinks.map((driveLink, index) => <DestinationCard key={driveLink.id} destination={driveLink} index={index} />) : <p className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">لا توجد روابط متاحة لهذه المادة حاليًا.</p>}
                {subjects.length ? <SubjectQuickNavigation subjects={subjects} currentSlug={content.subject.slug} /> : null}
                <Link href="/#subjects" className="inline-flex min-h-12 items-center rounded-2xl px-4 font-bold text-[var(--sanabil-navy)] hover:bg-white">→ العودة إلى جميع المواد</Link>
              </div>
            </section>
          </>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
