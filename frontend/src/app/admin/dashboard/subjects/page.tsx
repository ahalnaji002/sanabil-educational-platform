import type { Metadata } from "next";
import { AdminSubjectsPage } from "../../../../components/admin/admin-subjects-page";

export const metadata: Metadata = { title: "إدارة المواد" };

export default function SubjectsAdminPage() {
  return <AdminSubjectsPage />;
}
