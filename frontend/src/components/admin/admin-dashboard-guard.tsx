"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AdminAuthError, adminAuthService } from "../../services/admin-auth-service";
import type { Admin } from "../../types/admin";
import { AdminLoading } from "./admin-loading";
import { AdminProvider } from "./admin-context";
import { DashboardShell } from "./dashboard-shell";

export function AdminDashboardGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [error, setError] = useState<"forbidden" | "unavailable" | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    adminAuthService.getCurrentAdmin()
      .then((currentAdmin) => {
        if (active) setAdmin(currentAdmin);
      })
      .catch((authError: unknown) => {
        if (!active) return;
        if (authError instanceof AdminAuthError && authError.kind === "unauthorized") {
          router.replace("/admin/login");
          return;
        }
        setError(authError instanceof AdminAuthError && authError.kind === "forbidden" ? "forbidden" : "unavailable");
      });

    return () => { active = false; };
  }, [attempt, router]);

  if (admin) {
    return (
      <AdminProvider value={admin}>
        <DashboardShell admin={admin} onLoggedOut={() => setAdmin(null)}>{children}</DashboardShell>
      </AdminProvider>
    );
  }
  if (!error) return <AdminLoading />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--sanabil-cream)] px-5">
      <section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_60px_rgba(7,27,54,.1)]">
        <h1 className="text-2xl font-black text-[var(--sanabil-navy)]">{error === "forbidden" ? "الوصول غير مسموح" : "تعذر الاتصال بالخادم"}</h1>
        <p className="mt-3 leading-7 text-slate-600">{error === "forbidden" ? "لا يملك هذا الحساب صلاحية دخول لوحة الإدارة." : "لم نتمكن من التحقق من جلسة الإدارة. تحقق من اتصالك ثم حاول مجددًا."}</p>
        {error === "unavailable" ? <button type="button" onClick={() => { setError(null); setAttempt((value) => value + 1); }} className="mt-6 min-h-11 rounded-xl bg-[var(--sanabil-navy)] px-5 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)]">إعادة المحاولة</button> : null}
      </section>
    </main>
  );
}
