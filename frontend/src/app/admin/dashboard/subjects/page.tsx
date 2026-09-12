import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSubjectsPage } from "../../../../components/admin/admin-subjects-page";

export const metadata: Metadata = { title: "إدارة المواد" };

export default function SubjectsAdminPage() {
  return <Suspense fallback={<p>جارٍ تحميل المواد...</p>}><AdminSubjectsPage /></Suspense>;
}
