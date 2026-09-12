import type { PrismaClient } from "@prisma/client";
import type { AdminRecord } from "../auth/auth.types.js";

export interface ProfileRepository {
  findById(id: number): Promise<AdminRecord | null>;
  findByEmail(email: string): Promise<AdminRecord | null>;
  updateProfile(id: number, data: { name: string; email: string }): Promise<AdminRecord>;
  updatePassword(id: number, passwordHash: string): Promise<void>;
}
const select = { id: true, name: true, email: true, passwordHash: true, role: true, isActive: true } as const;
export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly db: PrismaClient) {}
  findById(id: number) { return this.db.admin.findUnique({ where: { id }, select }); }
  findByEmail(email: string) { return this.db.admin.findUnique({ where: { email }, select }); }
  updateProfile(id: number, data: { name: string; email: string }) { return this.db.admin.update({ where: { id }, data, select }); }
  async updatePassword(id: number, passwordHash: string) { await this.db.admin.update({ where: { id }, data: { passwordHash } }); }
}
