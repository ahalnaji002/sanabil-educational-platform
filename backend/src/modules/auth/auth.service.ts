import bcrypt from "bcrypt";
import { ApiError } from "../../utils/api-error.js";
import type { AdminRepository } from "./auth.repository.js";
import { safeAdmin } from "./auth.types.js";
const dummyHash = bcrypt.hashSync("InvalidPassword1", 10);
export class AuthService {
  constructor(private readonly repo: AdminRepository) {}
  async login(email: string, password: string) {
    const admin = await this.repo.findByEmail(email);
    const valid = await bcrypt.compare(password, admin?.passwordHash ?? dummyHash);
    if (!admin || !admin.isActive || !valid) throw new ApiError(401, "Invalid email or password");
    return safeAdmin(admin);
  }
  async current(id: number) {
    const admin = await this.repo.findById(id);
    if (!admin?.isActive) throw new ApiError(401, "Authentication required");
    return safeAdmin(admin);
  }
}
