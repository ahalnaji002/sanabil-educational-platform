"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "./brand-mark";

const navigationLinks = [
  { href: "/#home", hash: "#home", label: "الرئيسية" },
  { href: "/#announcements", hash: "#announcements", label: "الإعلانات" },
  { href: "/#subjects", hash: "#subjects", label: "المواد" },
  { href: "/#how-it-works", hash: "#how-it-works", label: "كيف تعمل المنصة" },
] as const;

type NavigationHash = (typeof navigationLinks)[number]["hash"];

export function SiteHeader() {
  const pathname = usePathname();
  const [visibleSection, setVisibleSection] = useState<NavigationHash>("#home");
  const activeHash = pathname === "/" ? visibleSection : null;

  useEffect(() => {
    if (pathname !== "/") return;

    let animationFrame = 0;

    const updateActiveSection = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const activationLine = window.innerHeight * 0.35;
        let active: NavigationHash = navigationLinks[0].hash;

        for (const link of navigationLinks) {
          const section = document.querySelector<HTMLElement>(link.hash);
          if (section && section.getBoundingClientRect().top <= activationLine) {
            active = link.hash;
          }
        }

        setVisibleSection(active);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--sanabil-navy)]/95 text-white shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:flex-nowrap sm:gap-y-3 sm:px-8">
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

        <nav aria-label="التنقل الرئيسي" className="order-3 w-full sm:order-none sm:w-auto">
          <ul className="flex w-full items-center justify-between gap-0.5 sm:w-auto sm:justify-start sm:gap-1">
            {navigationLinks.map((link) => {
              const isActive = activeHash === link.hash;
              const stateClass = isActive
                ? "bg-white/10 text-[var(--sanabil-gold)]"
                : "text-slate-300 hover:bg-white/10 hover:text-white sm:text-slate-200";

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "location" : undefined}
                    className={[
                      "inline-flex min-h-9 items-center whitespace-nowrap rounded-lg px-2 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)] sm:min-h-10 sm:rounded-xl sm:px-3 sm:text-sm",
                      stateClass,
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}