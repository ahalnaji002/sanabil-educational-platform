"use client";

import Image from "next/image";
import type { Announcement } from "@/types/announcement";
import { resolveAnnouncementImageUrl } from "../lib/api-client";

export function AnnouncementCard({ announcement, onSelect }: { announcement: Announcement; onSelect: (announcement: Announcement) => void }) {
  const imageUrl = resolveAnnouncementImageUrl(announcement.imageUrl);
  return (
    <article className="group relative min-h-72 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#102d52,#071b36)] p-6 text-white shadow-[0_18px_50px_rgba(7,27,54,.14)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(7,27,54,.22)] motion-reduce:transform-none motion-reduce:transition-none">
      {imageUrl ? <><Image src={imageUrl} alt="" fill unoptimized={imageUrl.startsWith("http")} sizes="(min-width: 768px) 50vw, 100vw" className="object-contain object-left opacity-25 transition duration-300 group-hover:opacity-35 motion-reduce:transition-none" /><div aria-hidden="true" className="absolute inset-0 bg-gradient-to-l from-[#071b36] via-[#071b36]/80 to-[#071b36]/25" /></> : null}
      <div aria-hidden="true" className="absolute -bottom-16 -left-12 size-52 rounded-full border-[36px] border-[var(--sanabil-gold)]/10 transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none" />
      <div className="relative z-10 flex h-full flex-col">
        {announcement.badge ? <span className="w-fit rounded-full bg-[var(--sanabil-gold)] px-3 py-1 text-xs font-bold text-[var(--sanabil-navy)]">{announcement.badge}</span> : null}
        <h3 className="mt-6 text-2xl font-extrabold leading-tight">{announcement.title}</h3>
        <p className="mt-3 line-clamp-3 grow whitespace-pre-line leading-7 text-slate-300">{announcement.content}</p>
        <button type="button" onClick={() => onSelect(announcement)} className="mt-6 inline-flex min-h-12 w-fit items-center gap-2 rounded-2xl border border-white/20 px-5 font-bold transition duration-200 hover:border-[var(--sanabil-gold)] hover:bg-[var(--sanabil-gold)] hover:text-[var(--sanabil-navy)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sanabil-gold)]">
          عرض التفاصيل <span aria-hidden="true">←</span>
        </button>
      </div>
    </article>
  );
}
