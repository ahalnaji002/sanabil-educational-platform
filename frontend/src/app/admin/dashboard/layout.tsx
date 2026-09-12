import type { ReactNode } from "react";
import { AdminDashboardGuard } from "../../../components/admin/admin-dashboard-guard";

export default function AdminDashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AdminDashboardGuard>{children}</AdminDashboardGuard>;
}
