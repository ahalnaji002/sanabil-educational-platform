"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Announcement } from "@/types/announcement";

export function AnnouncementDialog({ announcement, onClose }: { announcement: Announcement | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !announcement) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      document.body.style.overflow = "";
      if (dialog.open) dialog.close();
      previousFocus.current?.focus();
    };
  }, [announcement]);

  if (!announcement) return null;
  const external = announcement.ctaUrl ? announcement.ctaUrl.startsWith("http://") || announcement.ctaUrl.startsWith("https://") : false;
  const cta = announcement.ctaLabel && announcement.ctaUrl ? (
    <a
      href={announcement.ctaUrl}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="mt-7 inline-flex min-h-12 items-center rounded-2xl bg-[var(--sanabil-gold)] px-5 font-bold text-[var(--sanabil-navy)] transition hover:bg-[var(--sanabil-gold-dark)] active:scale-95"
    >
      {announcement.ctaLabel}
    </a>
  ) : null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="announcement-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className={`m-auto max-h-[85dvh] overflow-y-auto overscroll-contain rounded-[2rem] border-0 bg-white p-0 text-right text-[var(--sanabil-navy)] shadow-2xl backdrop:bg-[#031024]/75 backdrop:backdrop-blur-sm sm:max-h-[92dvh] ${
        announcement.image
          ? "w-[calc(100%_-_1rem)] sm:w-[min(calc(100vw-1.5rem),70.4dvh,42rem)]"
          : "w-[calc(100%_-_1.5rem)] max-w-2xl"
      }`}
    >
      {announcement.image ? (
        <div className="relative w-full overflow-hidden bg-white sm:flex sm:aspect-[1117/1170] sm:items-end sm:bg-[var(--sanabil-navy)] sm:text-white">
          <div className="relative h-[34dvh] min-h-52 max-h-64 w-full overflow-hidden bg-[var(--sanabil-navy)] sm:absolute sm:inset-0 sm:h-auto sm:min-h-0">
            <Image
              src={announcement.image}
              alt=""
              fill
              priority
              sizes="(max-width: 639px) 100vw, 1px"
              className="scale-110 object-cover opacity-30 blur-md sm:hidden"
            />
            <Image
              src={announcement.image}
              alt=""
              fill
              priority
              sizes="(max-width: 672px) 100vw, 672px"
              className="object-contain opacity-95 sm:opacity-80"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[var(--sanabil-navy)]/35 to-transparent sm:bg-[linear-gradient(to_bottom,rgba(7,27,54,.08)_25%,rgba(7,27,54,.5)_58%,rgba(3,16,36,.98)_100%)]"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الإعلان"
            className="absolute left-3 top-3 z-20 flex size-11 items-center justify-center rounded-full border border-white/30 bg-[var(--sanabil-navy)]/75 text-2xl text-white shadow-lg backdrop-blur-sm transition hover:bg-[var(--sanabil-navy)] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-4 sm:top-4"
          >
            ×
          </button>

          <div className="relative z-10 w-full px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:p-9 sm:[text-shadow:0_2px_16px_rgba(0,0,0,.7)]">
            {announcement.badge && (
              <span className="inline-flex rounded-full bg-[var(--sanabil-gold)] px-3 py-1 text-xs font-bold text-[var(--sanabil-navy)] [text-shadow:none]">
                {announcement.badge}
              </span>
            )}
            <h2 id="announcement-title" className="mt-3 text-2xl font-extrabold leading-tight text-[var(--sanabil-navy)] sm:mt-4 sm:text-4xl sm:text-white">
              {announcement.title}
            </h2>
            <p className="mt-3 max-w-xl whitespace-pre-line text-sm leading-7 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8 sm:text-slate-100">
              {announcement.details}
            </p>
            {cta}
          </div>
        </div>
      ) : (
        <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              {announcement.badge && (
                <span className="rounded-full bg-[var(--sanabil-gold-soft)] px-3 py-1 text-xs font-bold">
                  {announcement.badge}
                </span>
              )}
              <h2 id="announcement-title" className="mt-4 text-2xl font-extrabold sm:text-3xl">
                {announcement.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق الإعلان"
              className="sticky top-0 flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl transition hover:bg-slate-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--sanabil-navy)] sm:static"
            >
              ×
            </button>
          </div>
          <p className="mt-5 whitespace-pre-line leading-8 text-slate-600">{announcement.details}</p>
          {cta}
        </div>
      )}
    </dialog>
  );
}