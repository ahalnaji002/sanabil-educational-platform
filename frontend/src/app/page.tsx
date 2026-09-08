import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SubjectCard } from "@/components/subject-card";
import { AnnouncementsSection } from "@/components/announcements-section";
import { subjectService } from "@/services/subject-service";
import { announcementService } from "@/services/announcement-service";

export default async function HomePage() {
  const subjects = await subjectService.getSubjects();
  const announcements = await announcementService.getActiveAnnouncements();
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[var(--sanabil-navy)] px-5 pb-24 pt-14 text-white sm:px-8 sm:pb-32 sm:pt-20">
          <div
            aria-hidden="true"
            className="absolute -left-24 top-10 size-72 rounded-full border border-[var(--sanabil-gold)]/20"
          />
          <div
            aria-hidden="true"
            className="absolute -left-8 top-28 size-40 rounded-full border border-[var(--sanabil-gold)]/20"
          />
          <div className="relative mx-auto max-w-6xl">
            <span className="inline-flex rounded-full border border-[var(--sanabil-gold)]/40 bg-[var(--sanabil-gold)]/10 px-4 py-2 text-sm font-bold text-[var(--sanabil-gold)]">
              من غزة، نصنع مساحة للتعلّم
            </span>
            <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.35] sm:text-5xl lg:text-6xl">
              طريقك إلى المعرفة
              <span className="mt-2 block text-[var(--sanabil-gold)]">
                أوضح، أقرب، وأسهل.
              </span>
            </h1>
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300 sm:text-xl lg:whitespace-nowrap">
              اختر مادتك، ثم انتقل مباشرة إلى الوجهة التعليمية المعتمدة على
              Google Drive.
            </p>
            <a
              href="#subjects"
              className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-[var(--sanabil-gold)] px-6 font-extrabold text-[var(--sanabil-navy)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              ابدأ رحلتك التعليمية
            </a>
          </div>
        </section>
        <AnnouncementsSection announcements={announcements} />
        <section id="subjects" className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="font-bold text-[var(--sanabil-gold-dark)]">
              المواد التعليمية
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-3xl font-black text-[var(--sanabil-navy)] sm:text-4xl">
                اختر المادة التي تريدها
              </h2>
              <p className="max-w-md leading-7 text-slate-600">
                كل بطاقة تقودك إلى الوجهات المرتبة الخاصة بالمادة، دون تحميل أي
                محتوى تلقائياً.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          </div>
        </section>
        <section className="bg-white px-5 py-12 sm:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 rounded-[2rem] bg-[var(--sanabil-navy)] p-7 text-white sm:grid-cols-3 sm:p-10">
            <div>
              <strong className="text-3xl text-[var(--sanabil-gold)]">
                01
              </strong>
              <h3 className="mt-2 font-bold">اختر المادة</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                ابدأ من بطاقة المادة المناسبة.
              </p>
            </div>
            <div>
              <strong className="text-3xl text-[var(--sanabil-gold)]">
                02
              </strong>
              <h3 className="mt-2 font-bold">اختر الوجهة</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                حدد القسم الذي تحتاجه إن وُجد.
              </p>
            </div>
            <div>
              <strong className="text-3xl text-[var(--sanabil-gold)]">
                03
              </strong>
              <h3 className="mt-2 font-bold">تابع في Drive</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                تصفح المحتوى داخل Google Drive.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
