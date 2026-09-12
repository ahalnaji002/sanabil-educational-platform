"use client";

import { createContext, useContext } from "react";
import type { Admin } from "../../types/admin";

const AdminContext = createContext<Admin | null>(null);

export const AdminProvider = AdminContext.Provider;

export function useAdmin() {
  const admin = useContext(AdminContext);
  if (!admin) throw new Error("useAdmin must be used inside the protected admin layout");
  return admin;
}
