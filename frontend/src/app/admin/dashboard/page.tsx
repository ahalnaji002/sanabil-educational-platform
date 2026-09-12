import type { Metadata } from "next";
import { DashboardHome } from "../../../components/admin/dashboard-home";

export const metadata: Metadata = { title: "لوحة الإدارة" };

export default function AdminDashboardPage() {
  return <DashboardHome />;
}
