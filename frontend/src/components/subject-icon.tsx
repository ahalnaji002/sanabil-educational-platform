type SubjectIconName = "calculator" | "atom" | "flask" | "book" | "language" | "biology" | "technology";

export function SubjectIcon({ name }: { name: SubjectIconName }) {
  const symbols = { calculator: "∑", atom: "⚛", flask: "⌬", book: "أ", language: "Aa", biology: "🌿", technology: "</>" } as const;
  return <span aria-hidden="true" className="inline-flex size-14 items-center justify-center rounded-2xl bg-[var(--sanabil-gold-soft)] text-2xl font-black text-[var(--sanabil-navy)]">{symbols[name]}</span>;
}
