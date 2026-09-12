import type { PublicDriveLink } from "@/types/public-content";

export function DestinationCard({ destination, index }: { destination: PublicDriveLink; index: number }) {
  return (
    <article className="flex flex-col gap-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(7,27,54,.06)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--sanabil-gold-soft)] font-black text-[var(--sanabil-navy)]">{String(index + 1).padStart(2, "0")}</span>
        <div>
          <h2 className="text-xl font-extrabold text-[var(--sanabil-navy)]">{destination.title}</h2>
          {destination.description && <p className="mt-2 max-w-2xl leading-7 text-slate-600">{destination.description}</p>}
        </div>
      </div>
      <a href={destination.driveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--sanabil-gold)] px-5 font-extrabold text-[var(--sanabil-navy)] hover:bg-[var(--sanabil-gold-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-navy)]">
          فتح على Google Drive <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}
