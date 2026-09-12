import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import type { ProfileService } from "./profile.service.js";
import type { UpdatePasswordBody, UpdateProfileBody } from "./profile.schema.js";
import { ApiError } from "../../utils/api-error.js";

const adminId = (request: Request) => { if (!request.admin) throw new ApiError(401, "Authentication required"); return request.admin.id; };

export class ProfileController {
  constructor(private readonly service: ProfileService) {}
  update = async (req: Request, res: Response) => sendSuccess(res, 200, "Profile updated successfully", { admin: await this.service.update(adminId(req), req.body as UpdateProfileBody) });
  updatePassword = async (req: Request, res: Response) => { await this.service.updatePassword(adminId(req), req.body as UpdatePasswordBody); sendSuccess(res, 200, "Password updated successfully", null); };
}
