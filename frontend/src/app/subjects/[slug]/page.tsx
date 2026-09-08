import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DestinationCard } from "@/components/destination-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { localSubjects } from "@/data/subjects";
import { subjectService } from "@/services/subject-service";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => localSubjects.map(({ slug }) => ({ slug }));
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const subject = await subjectService.getSubjectBySlug((await params).slug);
  return subject ? { title: subject.name, description: subject.summary } : {};
}

export default async function SubjectPage({ params }: Props) {
  const subject = await subjectService.getSubjectBySlug((await params).slug);
  if (!subject) notFound();
  const links = [...subject.links].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100vh-180px)] bg-[var(--sanabil-cream)]">
        <section className="bg-[var(--sanabil-navy)] px-5 pb-16 pt-10 text-white sm:px-8 sm:pb-20">
          <div className="mx-auto max-w-5xl">
            <nav aria-label="مسار التنقل" className="text-sm text-slate-300"><Link href="/" className="hover:text-white">الرئيسية</Link><span className="mx-2">/</span><span>{subject.name}</span></nav>
            <p className="mt-10 font-bold text-[var(--sanabil-gold)]">وجهات المادة</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">{subject.name}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{subject.summary}. اختر الوجهة المناسبة ثم تابع التصفح داخل Google Drive.</p>
          </div>
        </section>
        <section className="px-5 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto max-w-5xl space-y-5">
            {links.length ? links.map((link, index) => <DestinationCard key={link.id} destination={link} index={index} />) : (
              <p className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">لا توجد وجهات متاحة لهذه المادة حالياً.</p>
            )}
            <Link href="/#subjects" className="inline-flex min-h-12 items-center rounded-2xl px-4 font-bold text-[var(--sanabil-navy)] hover:bg-white">→ العودة إلى جميع المواد</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
