"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AdminAuthError, adminAuthService } from "../../services/admin-auth-service";
import { AdminLoading } from "./admin-loading";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorMessage(error: unknown) {
  if (error instanceof AdminAuthError) {
    if (error.kind === "unauthorized") return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    if (error.kind === "forbidden") return "لا تملك صلاحية الوصول إلى لوحة الإدارة.";
    if (error.kind === "network") return "تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.";
    if (error.kind === "configuration") return "إعداد الاتصال بالخادم غير مكتمل.";
  }
  return "حدث خطأ غير متوقع. حاول مجددًا.";
}

export function AdminLoginForm() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    adminAuthService.getCurrentAdmin()
      .then(() => {
        if (active) router.replace("/admin/dashboard");
      })
      .catch((sessionError: unknown) => {
        if (!active) return;
        if (sessionError instanceof AdminAuthError && sessionError.kind !== "unauthorized") {
          setError(errorMessage(sessionError));
        }
        setCheckingSession(false);
      });

    return () => { active = false; };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setError("أدخل بريدًا إلكترونيًا صحيحًا.");
      return;
    }
    if (!password) {
      setError("أدخل كلمة المرور.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await adminAuthService.login(normalizedEmail, password);
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(errorMessage(loginError));
      setSubmitting(false);
    }
  }

  if (checkingSession) return <AdminLoading />;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--sanabil-navy)] px-5 py-10 sm:px-8">
      <div aria-hidden="true" className="absolute -right-24 top-10 size-72 rounded-full border border-[var(--sanabil-gold)]/20" />
      <div aria-hidden="true" className="absolute -left-20 bottom-0 size-64 rounded-full bg-[var(--sanabil-gold)]/5" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-9" aria-labelledby="admin-login-heading">
        <div className="flex items-center gap-4">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(7,27,54,.12)]">
            <Image src="/brand/sanabil-logo.png" alt="شعار منصة سنابل" fill sizes="64px" className="object-contain" priority />
          </span>
          <div>
            <p className="text-sm font-bold text-[var(--sanabil-gold-dark)]">منصة سنابل التعليمية</p>
            <h1 id="admin-login-heading" className="mt-1 text-2xl font-black text-[var(--sanabil-navy)]">دخول الإدارة</h1>
          </div>
        </div>

        <p className="mt-6 text-sm leading-7 text-slate-600">أدخل بيانات حساب الإدارة للوصول إلى مساحة إدارة المنصة.</p>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-bold text-[var(--sanabil-navy)]">البريد الإلكتروني</label>
            <input id="admin-email" name="email" type="email" inputMode="email" autoComplete="username" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} disabled={submitting} required className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-left text-[var(--sanabil-navy)] outline-none transition focus:border-[var(--sanabil-gold)] focus:ring-4 focus:ring-[var(--sanabil-gold)]/20 disabled:cursor-not-allowed disabled:bg-slate-100" />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-bold text-[var(--sanabil-navy)]">كلمة المرور</label>
            <input id="admin-password" name="password" type="password" autoComplete="current-password" dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitting} required className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-left text-[var(--sanabil-navy)] outline-none transition focus:border-[var(--sanabil-gold)] focus:ring-4 focus:ring-[var(--sanabil-gold)]/20 disabled:cursor-not-allowed disabled:bg-slate-100" />
          </div>

          {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800">{error}</p> : null}

          <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--sanabil-navy)] px-5 font-extrabold text-white transition hover:bg-[var(--sanabil-navy-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sanabil-gold)] disabled:cursor-not-allowed disabled:opacity-65">
            {submitting ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </section>
    </main>
  );
}
