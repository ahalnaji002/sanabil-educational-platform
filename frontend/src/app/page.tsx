import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SubjectsSection } from "@/components/subjects-section";
import { AnnouncementsSection } from "@/components/announcements-section";
import { localGrades } from "@/data/grades";
import { subjectService } from "@/services/subject-service";
import { announcementService } from "@/services/announcement-service";

export default async function HomePage() {
  const subjects = await subjectService.getSubjects();
  const announcements = await announcementService.getActiveAnnouncements();
  return (
    <>
      <SiteHeader />
      <main>
        <section id="home" className="section-reveal scroll-mt-24 relative overflow-hidden bg-[var(--sanabil-navy)] px-5 pb-24 pt-14 text-white sm:px-8 sm:pb-32 sm:pt-20">
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
              من فلسطين، نصنع مساحة للتعلّم
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
        <SubjectsSection grades={localGrades} subjects={subjects} />
        <section id="how-it-works" aria-labelledby="how-it-works-heading" className="section-reveal scroll-mt-24 bg-white px-5 py-12 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 id="how-it-works-heading" className="sr-only">كيف تعمل المنصة</h2>
            <div className="grid gap-6 rounded-[2rem] bg-[var(--sanabil-navy)] p-7 text-white sm:grid-cols-3 sm:p-10">
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
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
