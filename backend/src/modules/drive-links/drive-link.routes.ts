import { Router } from "express";
import type { AppConfig } from "../../config/env.js";
import { authenticateAdmin } from "../../middlewares/authenticate-admin.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { AdminRepository } from "../auth/auth.repository.js";
import type { SubjectRepository } from "../subjects/subject.repository.js";
import { DriveLinkController } from "./drive-link.controller.js";
import type { DriveLinkRepository } from "./drive-link.repository.js";
import {
  createDriveLinkBodySchema,
  driveLinkIdParamsSchema,
  driveLinkListQuerySchema,
  driveLinkPublicParamsSchema,
  driveLinkStatusBodySchema,
  reorderDriveLinksBodySchema,
  updateDriveLinkBodySchema,
} from "./drive-link.schema.js";
import { DriveLinkService } from "./drive-link.service.js";

const controllerFor = (driveLinkRepository: DriveLinkRepository, subjectRepository: SubjectRepository) =>
  new DriveLinkController(new DriveLinkService(driveLinkRepository, subjectRepository));

export const adminDriveLinkRouter = (
  config: AppConfig,
  adminRepository: AdminRepository,
  driveLinkRepository: DriveLinkRepository,
  subjectRepository: SubjectRepository,
) => {
  const router = Router();
  const controller = controllerFor(driveLinkRepository, subjectRepository);
  router.use(authenticateAdmin(config, adminRepository));
  router.get("/", validateRequest({ query: driveLinkListQuerySchema }), asyncHandler(controller.listAdmin));
  router.post("/", validateRequest({ body: createDriveLinkBodySchema }), asyncHandler(controller.create));
  router.patch("/reorder", validateRequest({ body: reorderDriveLinksBodySchema }), asyncHandler(controller.reorder));
  router.get("/:id", validateRequest({ params: driveLinkIdParamsSchema }), asyncHandler(controller.getAdmin));
  router.put("/:id", validateRequest({ params: driveLinkIdParamsSchema, body: updateDriveLinkBodySchema }), asyncHandler(controller.update));
  router.patch("/:id/status", validateRequest({ params: driveLinkIdParamsSchema, body: driveLinkStatusBodySchema }), asyncHandler(controller.updateStatus));
  router.delete("/:id", validateRequest({ params: driveLinkIdParamsSchema }), asyncHandler(controller.delete));
  return router;
};

export const publicDriveLinkRouter = (driveLinkRepository: DriveLinkRepository, subjectRepository: SubjectRepository) => {
  const router = Router({ mergeParams: true });
  const controller = controllerFor(driveLinkRepository, subjectRepository);
  router.get("/:slug/drive-links", validateRequest({ params: driveLinkPublicParamsSchema }), asyncHandler(controller.listPublic));
  return router;
};
