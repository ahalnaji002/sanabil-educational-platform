import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-[var(--sanabil-navy)] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sanabil-gold)]">
          <BrandMark />
          <span>
            <strong className="block text-base">منصة سنابل التعليمية</strong>
            <small className="text-xs text-slate-300">غزة، فلسطين</small>
          </span>
        </Link>
        <span className="hidden rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 sm:block">التعلّم يبدأ بخطوة</span>
      </div>
    </header>
  );
}
