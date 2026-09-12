"use client";

import { useCallback, useEffect, useState } from "react";
import type { Announcement } from "@/types/announcement";
import { announcementService } from "../services/announcement-service";
import { AnnouncementCard } from "./announcement-card";
import { AnnouncementDialog } from "./announcement-dialog";

export function AnnouncementsSection({ announcements: initialAnnouncements }: { announcements?: readonly Announcement[] }) {
  const [selected, setSelected] = useState<Announcement | null>(null);
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
  return (
    <section id="announcements" aria-labelledby="announcements-heading" className="section-reveal scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="font-bold text-[var(--sanabil-gold-dark)]">آخر المستجدات</p>
        <h2 id="announcements-heading" className="mt-2 text-3xl font-extrabold sm:text-4xl">إعلانات سنابل</h2>
        {loading ? <p className="mt-9 rounded-2xl bg-slate-50 p-8 text-center font-bold" aria-live="polite">جارٍ تحميل الإعلانات...</p> : null}
        {error ? <div className="mt-9 rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p role="alert" className="font-bold text-red-800">تعذر تحميل الإعلانات حاليًا.</p><button type="button" onClick={() => void load()} className="mt-4 min-h-11 rounded-xl bg-[var(--sanabil-navy)] px-5 font-bold text-white">إعادة المحاولة</button></div> : null}
        {!loading && !error ? <div className="mt-9 grid gap-5 md:grid-cols-2">{announcements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} onSelect={setSelected} />)}</div> : null}
      </div>
      <AnnouncementDialog announcement={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
