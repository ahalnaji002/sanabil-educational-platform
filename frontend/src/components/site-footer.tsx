const whatsappNumber = "972567777806";
const whatsappMessage = "مرحباً، أود الاستفسار عن منصة سنابل التعليمية.";
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 fill-current">
      <path d="M12.04 2a9.84 9.84 0 0 0-8.5 14.78L2 22l5.36-1.5A9.96 9.96 0 1 0 12.04 2Zm0 17.96a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.18.89.85-3.1-.2-.32a8.05 8.05 0 1 1 6.96 3.84Zm4.42-6.03c-.24-.12-1.43-.7-1.65-.79-.22-.08-.38-.12-.54.12-.16.25-.62.8-.76.96-.14.17-.28.19-.52.07-.24-.12-1.02-.38-1.94-1.2a7.22 7.22 0 0 1-1.34-1.67c-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.25-.84.83-.84 2.02 0 1.2.87 2.35.99 2.51.12.17 1.7 2.61 4.13 3.66.58.25 1.03.4 1.38.51.58.19 1.1.16 1.52.1.46-.07 1.43-.59 1.63-1.15.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[var(--sanabil-navy)] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xl font-extrabold">منصة سنابل التعليمية</p>
          <p className="mt-2 text-sm text-slate-300">أ. معتصم بسام ريحان</p>
          <a
            href="tel:+972567777806"
            dir="ltr"
            className="mt-2 inline-flex rounded-lg text-sm text-slate-300 transition hover:text-[var(--sanabil-gold)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sanabil-gold)]"
          >
            00972567777806
          </a>
        </div>

        <div className="sm:text-left">
          <p className="mb-3 text-sm font-bold text-slate-300">
            تحتاج مساعدة؟ تواصل معنا مباشرة
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="تواصل مع منصة سنابل عبر واتساب"
            className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#25d366] px-6 font-extrabold text-[#062d19] shadow-[0_12px_30px_rgba(37,211,102,.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#35e477] hover:shadow-[0_16px_36px_rgba(37,211,102,.3)] active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-auto"
          >
            <WhatsAppIcon />
            <span>تواصل عبر واتساب</span>
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:-translate-x-1"
            >
              ←
            </span>
          </a>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-5 text-center text-xs text-slate-400">
        المحتوى التعليمي يُفتح عبر Google Drive دون تنزيل تلقائي.
        <span className="mt-2 block text-[11px] text-slate-500">Designed &amp; Developed by Ahmed Hashem</span>
      </p>
    </footer>
  );
}
