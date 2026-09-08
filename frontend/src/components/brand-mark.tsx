import Image from "next/image";

export function BrandMark() {
  return (
    <span className="relative inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(224,177,59,.18)]" aria-hidden="true">
      <Image src="/brand/sanabil-logo.png" alt="" width={4500} height={4500} priority sizes="56px" className="size-full object-contain" />
    </span>
  );
}
