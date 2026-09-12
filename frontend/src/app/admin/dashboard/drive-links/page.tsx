import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminDriveLinksPage } from "../../../../components/admin/admin-drive-links-page";

export const metadata: Metadata = { title: "إدارة الروابط التعليمية" };
export default function DriveLinksAdminPage() { return <Suspense fallback={<p>جارٍ تحميل الروابط...</p>}><AdminDriveLinksPage /></Suspense>; }
