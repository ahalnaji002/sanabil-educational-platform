"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { adminAuthService } from "../../services/admin-auth-service";
import type { Admin } from "../../types/admin";

const navigation = [
  { label: "الرئيسية", href: "/admin/dashboard", enabled: true },
  { label: "الصفوف", href: "/admin/dashboard/grades", enabled: true },
  { label: "المواد", href: "/admin/dashboard/subjects", enabled: true },
  { label: "الروابط", href: "/admin/dashboard/drive-links", enabled: true },
  { label: "الإعلانات", href: "/admin/dashboard/announcements", enabled: false },
] as const;

function SidebarContent({ admin, pathname, onNavigate, onLogout, loggingOut }: {
  admin: Admin;
  pathname: string;
  onNavigate: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white">
          <Image src="/brand/sanabil-logo.png" alt="" fill sizes="48px" className="object-contain" />
        </span>
        <div>
          <strong className="block text-sm text-white">إدارة سنابل</strong>
          <span className="mt-1 block max-w-40 truncate text-xs text-slate-400">{admin.email}</span>
        </div>
      </div>

      <nav aria-label="تنقل لوحة الإدارة" className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.href}>
              {item.enabled ? (
                <Link href={item.href} onClick={onNavigate} aria-current={pathname === item.href ? "page" : undefined} className={`flex min-h-11 items-center rounded-xl px-4 font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${pathname === item.href ? "bg-[var(--sanabil-gold)] text-[var(--sanabil-navy)]" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}>
                  {item.label}
                </Link>
              ) : (
                <span aria-disabled="true" className="flex min-h-11 cursor-not-allowed items-center justify-between rounded-xl px-4 font-semibold text-slate-400">
                  <span>{item.label}</span>
                  <small className="text-[10px]">قريبًا</small>
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <button type="button" onClick={onLogout} disabled={loggingOut} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-white/15 px-4 font-bold text-white transition hover:border-red-300 hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60">
          {loggingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
        </button>
      </div>
    </div>
  );
}

export function DashboardShell({ admin, children, onLoggedOut }: { admin: Admin; children: ReactNode; onLoggedOut: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await adminAuthService.logout();
      onLoggedOut();
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setLogoutError("تعذر تسجيل الخروج. تحقق من اتصالك وحاول مجددًا.");
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-72 bg-[var(--sanabil-navy)] shadow-2xl lg:block" aria-label="القائمة الجانبية للإدارة">
        <SidebarContent admin={admin} pathname={pathname} onNavigate={() => setMenuOpen(false)} onLogout={handleLogout} loggingOut={loggingOut} />
      </aside>

      {menuOpen ? (
        <>
          <button type="button" aria-label="إغلاق قائمة الإدارة" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-slate-950/55 lg:hidden" />
          <aside className="fixed inset-y-0 right-0 z-50 w-72 bg-[var(--sanabil-navy)] shadow-2xl lg:hidden" aria-label="قائمة الإدارة للجوال">
            <SidebarContent admin={admin} pathname={pathname} onNavigate={() => setMenuOpen(false)} onLogout={handleLogout} loggingOut={loggingOut} />
          </aside>
        </>
      ) : null}

      <div className="lg:pr-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[var(--sanabil-gold-dark)]">لوحة الإدارة</p>
              <p className="mt-1 font-extrabold text-[var(--sanabil-navy)]">منصة سنابل التعليمية</p>
            </div>
            <button type="button" aria-label="فتح قائمة الإدارة" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="flex size-11 items-center justify-center rounded-xl border border-slate-200 text-2xl font-bold text-[var(--sanabil-navy)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)] lg:hidden">☰</button>
          </div>
        </header>

        {logoutError ? <p role="alert" className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 sm:mx-8">{logoutError}</p> : null}
        <main className="px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
