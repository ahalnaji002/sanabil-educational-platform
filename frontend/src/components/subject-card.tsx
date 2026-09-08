import Link from "next/link";
import type { Subject } from "@/types/subject";
import { SubjectIcon } from "./subject-icon";

export function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <article className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(7,27,54,.06)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sanabil-gold)] hover:shadow-[0_18px_50px_rgba(7,27,54,.12)] active:scale-[.99]">
      <SubjectIcon name={subject.icon} />
      <h3 className="mt-5 text-xl font-extrabold text-[var(--sanabil-navy)]">{subject.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{subject.summary}</p>
      <Link href={`/subjects/${subject.slug}`} className="mt-5 flex min-h-12 items-center justify-between rounded-2xl bg-[var(--sanabil-navy)] px-4 font-bold text-white transition duration-200 active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)]">
        <span>عرض المادة</span><span aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
      </Link>
    </article>
  );
}
