import type { AdminRole } from "@prisma/client";
export type AdminRecord = { id: number; name: string; email: string; passwordHash: string; role: AdminRole; isActive: boolean };
export type SafeAdmin = Omit<AdminRecord, "passwordHash" | "isActive">;
export const safeAdmin = ({ id, name, email, role }: AdminRecord): SafeAdmin => ({ id, name, email, role });
