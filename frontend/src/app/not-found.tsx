import Link from "next/link";
export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[var(--sanabil-navy)] p-6 text-center text-white"><div><p className="text-7xl font-black text-[var(--sanabil-gold)]">404</p><h1 className="mt-4 text-3xl font-black">الصفحة غير موجودة</h1><Link href="/" className="mt-8 inline-flex rounded-2xl bg-[var(--sanabil-gold)] px-6 py-3 font-bold text-[var(--sanabil-navy)]">العودة للرئيسية</Link></div></main>;
}
