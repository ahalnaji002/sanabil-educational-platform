import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Alexandria } from "next/font/google";
import "./globals.css";

const alexandria = Alexandria({ subsets: ["arabic", "latin"], variable: "--font-alexandria", display: "swap" });

export const metadata: Metadata = {
  title: { default: "منصة سنابل التعليمية", template: "%s | سنابل" },
  description: "روابط المواد التعليمية لطلبة فلسطين",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${alexandria.variable} antialiased`}>{children}</body>
    </html>
  );
}
