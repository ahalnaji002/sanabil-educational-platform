import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { ApiError } from "../../utils/api-error.js";
import { safeAdmin } from "../auth/auth.types.js";
import type { ProfileRepository } from "./profile.repository.js";
import type { UpdatePasswordBody, UpdateProfileBody } from "./profile.schema.js";

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}
  async update(id: number, input: UpdateProfileBody) {
    const current = await this.repository.findById(id); if (!current?.isActive) throw new ApiError(401, "Authentication required");
    const duplicate = await this.repository.findByEmail(input.email); if (duplicate && duplicate.id !== id) throw new ApiError(409, "Email already exists", { email: "Email is already in use" });
    try { return safeAdmin(await this.repository.updateProfile(id, { name: input.name.trim(), email: input.email })); }
    catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "Email already exists", { email: "Email is already in use" }); throw error; }
  }
  async updatePassword(id: number, input: UpdatePasswordBody) {
    const current = await this.repository.findById(id); if (!current?.isActive) throw new ApiError(401, "Authentication required");
    if (!await bcrypt.compare(input.currentPassword, current.passwordHash)) throw new ApiError(400, "Current password is incorrect", { currentPassword: "Current password is incorrect" });
    await this.repository.updatePassword(id, await bcrypt.hash(input.newPassword, 12));
  }
}
