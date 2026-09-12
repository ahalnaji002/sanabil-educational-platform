import { Router } from "express";
import type { AppConfig } from "../../config/env.js";
import { authenticateAdmin } from "../../middlewares/authenticate-admin.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { AdminRepository } from "../auth/auth.repository.js";
import { ProfileController } from "./profile.controller.js";
import type { ProfileRepository } from "./profile.repository.js";
import { updatePasswordBodySchema, updateProfileBodySchema } from "./profile.schema.js";
import { ProfileService } from "./profile.service.js";

export const profileRouter = (config: AppConfig, admins: AdminRepository, repository: ProfileRepository) => {
  const router = Router(); const controller = new ProfileController(new ProfileService(repository)); router.use(authenticateAdmin(config, admins));
  router.put("/", validateRequest({ body: updateProfileBodySchema }), asyncHandler(controller.update));
  router.put("/password", validateRequest({ body: updatePasswordBodySchema }), asyncHandler(controller.updatePassword));
  return router;
};
