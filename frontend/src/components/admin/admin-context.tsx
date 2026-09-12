"use client";

import { createContext, useContext } from "react";
import type { Admin } from "../../types/admin";

type AdminContextValue = { admin: Admin; setAdmin: (admin: Admin) => void };
const AdminContext = createContext<AdminContextValue | null>(null);

export const AdminProvider = AdminContext.Provider;

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used inside the protected admin layout");
  return context.admin;
}

export function useAdminContext() { const context = useContext(AdminContext); if (!context) throw new Error("useAdminContext must be used inside the protected admin layout"); return context; }
