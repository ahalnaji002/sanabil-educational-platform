"use client";

import { useState } from "react";
import type { Announcement } from "@/types/announcement";
import { AnnouncementCard } from "./announcement-card";
import { AnnouncementDialog } from "./announcement-dialog";

export function AnnouncementsSection({ announcements }: { announcements: readonly Announcement[] }) {
  const [selected, setSelected] = useState<Announcement | null>(null);
  if (!announcements.length) return null;
  return (
    <section id="announcements" aria-labelledby="announcements-heading" className="section-reveal scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="font-bold text-[var(--sanabil-gold-dark)]">آخر المستجدات</p>
        <h2 id="announcements-heading" className="mt-2 text-3xl font-extrabold sm:text-4xl">إعلانات سنابل</h2>
        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {announcements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} onSelect={setSelected} />)}
        </div>
      </div>
      <AnnouncementDialog announcement={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
