import type { PrismaClient } from "@prisma/client";
import type { AdminRecord } from "./auth.types.js";
export interface AdminRepository { findByEmail(email: string): Promise<AdminRecord | null>; findById(id: number): Promise<AdminRecord | null> }
const select = { id: true, name: true, email: true, passwordHash: true, role: true, isActive: true } as const;
export class PrismaAdminRepository implements AdminRepository {
  constructor(private readonly db: PrismaClient) {}
  findByEmail(email: string) { return this.db.admin.findUnique({ where: { email }, select }); }
  findById(id: number) { return this.db.admin.findUnique({ where: { id }, select }); }
}
