import { Router } from "express";
import type { AppConfig } from "../../config/env.js";
import { authenticateAdmin } from "../../middlewares/authenticate-admin.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { AdminRepository } from "../auth/auth.repository.js";
import { AnnouncementController } from "./announcement.controller.js";
import type { AnnouncementRepository } from "./announcement.repository.js";
import { announcementIdParamsSchema, announcementListQuerySchema, announcementStatusBodySchema, createAnnouncementBodySchema, reorderAnnouncementsBodySchema, updateAnnouncementBodySchema } from "./announcement.schema.js";
import { AnnouncementService } from "./announcement.service.js";
import { uploadAnnouncementImage } from "./announcement-upload.js";

const controllerFor = (repository: AnnouncementRepository) => new AnnouncementController(new AnnouncementService(repository));
export const adminAnnouncementRouter = (config: AppConfig, admins: AdminRepository, repository: AnnouncementRepository) => {
  const router = Router(); const controller = controllerFor(repository); router.use(authenticateAdmin(config, admins));
  router.get("/", validateRequest({ query: announcementListQuerySchema }), asyncHandler(controller.listAdmin));
  router.post("/", uploadAnnouncementImage, validateRequest({ body: createAnnouncementBodySchema }), asyncHandler(controller.create));
  router.patch("/reorder", validateRequest({ body: reorderAnnouncementsBodySchema }), asyncHandler(controller.reorder));
  router.get("/:id", validateRequest({ params: announcementIdParamsSchema }), asyncHandler(controller.getAdmin));
  router.put("/:id", uploadAnnouncementImage, validateRequest({ params: announcementIdParamsSchema, body: updateAnnouncementBodySchema }), asyncHandler(controller.update));
  router.patch("/:id/status", validateRequest({ params: announcementIdParamsSchema, body: announcementStatusBodySchema }), asyncHandler(controller.updateStatus));
  return router;
};
export const publicAnnouncementRouter = (repository: AnnouncementRepository) => { const router = Router(); const controller = controllerFor(repository); router.get("/", asyncHandler(controller.listPublic)); return router; };
