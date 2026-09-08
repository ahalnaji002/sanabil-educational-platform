import Link from "next/link";
import { BrandMark } from "./brand-mark";

const navigationLinks = [
  { href: "/#home", label: "الرئيسية" },
  { href: "/#announcements", label: "الإعلانات" },
  { href: "/#subjects", label: "المواد" },
  { href: "/#how-it-works", label: "كيف تعمل المنصة" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--sanabil-navy)]/95 text-white shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3 sm:flex-nowrap sm:px-8">
        <Link
          href="/#home"
          className="flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sanabil-gold)]"
        >
          <BrandMark />
          <span>
            <strong className="block text-base">منصة سنابل التعليمية</strong>
            <small className="text-xs text-slate-300">فلسطين</small>
          </span>
        </Link>

        <nav aria-label="التنقل الرئيسي" className="order-3 w-full overflow-x-auto sm:order-none sm:w-auto">
          <ul className="flex min-w-max items-center gap-1">
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}