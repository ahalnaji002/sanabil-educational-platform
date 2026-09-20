"use client";

import { useCallback, useEffect, useState } from "react";
import type { Announcement } from "@/types/announcement";
import { announcementService } from "../services/announcement-service";
import { AnnouncementCard } from "./announcement-card";
import { AnnouncementDialog } from "./announcement-dialog";

export function AnnouncementsSection({ announcements: initialAnnouncements }: { announcements?: readonly Announcement[] }) {
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [announcements, setAnnouncements] = useState<readonly Announcement[]>(initialAnnouncements ?? []);
  const [loading, setLoading] = useState(initialAnnouncements === undefined);
  const [error, setError] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(false); try { setAnnouncements(await announcementService.getActiveAnnouncements()); } catch { setError(true); } finally { setLoading(false); } }, []);
  useEffect(() => {
    if (initialAnnouncements !== undefined) return;
    let active = true;
    announcementService.getActiveAnnouncements().then((items) => { if (active) setAnnouncements(items); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [initialAnnouncements]);
  if (!loading && !error && !announcements.length) return null;
  const visibleAnnouncements = announcements.slice(0, 2);
  const extraAnnouncements = announcements.slice(2);
  return (
    <section id="announcements" aria-labelledby="announcements-heading" className="section-reveal scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="font-bold text-[var(--sanabil-gold-dark)]">آخر المستجدات</p>
        <h2 id="announcements-heading" className="mt-2 text-3xl font-extrabold sm:text-4xl">إعلانات سنابل</h2>
        {loading ? <p className="mt-9 rounded-2xl bg-slate-50 p-8 text-center font-bold" aria-live="polite">جارٍ تحميل الإعلانات...</p> : null}
        {error ? <div className="mt-9 rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p role="alert" className="font-bold text-red-800">تعذر تحميل الإعلانات حاليًا.</p><button type="button" onClick={() => void load()} className="mt-4 min-h-11 rounded-xl bg-[var(--sanabil-navy)] px-5 font-bold text-white">إعادة المحاولة</button></div> : null}
        {!loading && !error ? <>
          <div className="mt-9 grid gap-5 md:grid-cols-2">{visibleAnnouncements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} onSelect={setSelected} />)}</div>
          {extraAnnouncements.length > 0 ? <>
            <div
              id="more-announcements"
              aria-hidden={!expanded}
              inert={!expanded ? true : undefined}
              className={`grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-500 ease-out motion-reduce:transition-none ${expanded ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] opacity-0 -translate-y-3"}`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="grid gap-5 pt-5 md:grid-cols-2">{extraAnnouncements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} onSelect={setSelected} />)}</div>
              </div>
            </div>
            <div className="mt-7 flex justify-center">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls="more-announcements"
                onClick={() => setExpanded((value) => !value)}
                className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-[var(--sanabil-navy)]/15 bg-slate-50 px-6 font-extrabold text-[var(--sanabil-navy)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--sanabil-gold)] hover:bg-[var(--sanabil-gold-soft)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sanabil-gold-dark)] motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span>{expanded ? "عرض أقل" : `عرض المزيد (${extraAnnouncements.length})`}</span>
                <span aria-hidden="true" className={`text-lg transition-transform duration-300 motion-reduce:transition-none ${expanded ? "rotate-180" : "rotate-0"}`}>⌄</span>
              </button>
            </div>
          </> : null}
        </> : null}
      </div>
      <AnnouncementDialog announcement={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
