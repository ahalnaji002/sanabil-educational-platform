import Link from "next/link";
import type { Subject } from "@/types/subject";

type SubjectQuickNavigationProps = {
  subjects: readonly Subject[];
  currentSlug: string;
};

export function SubjectQuickNavigation({
  subjects,
  currentSlug,
}: SubjectQuickNavigationProps) {
  return (
    <nav
      aria-labelledby="subject-quick-navigation-heading"
      className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(7,27,54,.04)] sm:p-6"
    >
      <h2
        id="subject-quick-navigation-heading"
        className="text-lg font-extrabold text-[var(--sanabil-navy)]"
      >
        انتقل إلى مادة أخرى
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {subjects.map((subject) => {
          const isCurrent = subject.slug === currentSlug;

          return (
            <li key={subject.id}>
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--sanabil-gold)] px-4 text-sm font-extrabold text-[var(--sanabil-navy)] shadow-sm"
                >
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--sanabil-navy)]" />
                  {subject.name}
                  <span className="sr-only">(المادة الحالية)</span>
                </span>
              ) : (
                <Link
                  href={`/subjects/${subject.slug}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-[var(--sanabil-cream)] px-4 text-sm font-bold text-[var(--sanabil-navy)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--sanabil-gold)] hover:bg-[var(--sanabil-gold-soft)] active:translate-y-0 active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-navy)]"
                >
                  {subject.name}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}