import { BrandMark } from "../brand-mark";

export function AdminLoading({ label = "جارٍ التحقق من الجلسة..." }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--sanabil-cream)] px-5">
      <div className="flex flex-col items-center gap-4 text-center" role="status">
        <BrandMark />
        <span className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--sanabil-gold)] motion-reduce:animate-none" aria-hidden="true" />
        <p className="font-bold text-[var(--sanabil-navy)]">{label}</p>
      </div>
    </main>
  );
}
