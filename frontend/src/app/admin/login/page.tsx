import type { Metadata } from "next";
import { AdminLoginForm } from "../../../components/admin/admin-login-form";

export const metadata: Metadata = { title: "دخول الإدارة" };

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
