import type { Metadata } from "next";
import { AdminGradesPage } from "../../../../components/admin/admin-grades-page";
export const metadata: Metadata = { title: "إدارة الصفوف" };
export default function GradesAdminPage() { return <AdminGradesPage />; }
