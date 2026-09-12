import { Router } from "express";
import type { AppConfig } from "../../config/env.js";
import { authenticateAdmin } from "../../middlewares/authenticate-admin.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { AdminRepository } from "../auth/auth.repository.js";
import { SubjectController } from "./subject.controller.js";
import type { SubjectRepository } from "./subject.repository.js";
import {
  createSubjectBodySchema,
  publicSubjectListQuerySchema,
  subjectIdParamsSchema,
  subjectListQuerySchema,
  updateSubjectBodySchema,
} from "./subject.schema.js";
import { SubjectService } from "./subject.service.js";

export const adminSubjectRouter = (
  config: AppConfig,
  adminRepository: AdminRepository,
  subjectRepository: SubjectRepository,
) => {
  const router = Router();
  const controller = new SubjectController(new SubjectService(subjectRepository));

  router.use(authenticateAdmin(config, adminRepository));
  router.get("/", validateRequest({ query: subjectListQuerySchema }), asyncHandler(controller.listAdmin));
  router.get("/:id", validateRequest({ params: subjectIdParamsSchema }), asyncHandler(controller.getAdmin));
  router.post("/", validateRequest({ body: createSubjectBodySchema }), asyncHandler(controller.create));
  router.put("/:id", validateRequest({ params: subjectIdParamsSchema, body: updateSubjectBodySchema }), asyncHandler(controller.update));
  router.delete("/:id", validateRequest({ params: subjectIdParamsSchema }), asyncHandler(controller.deactivate));

  return router;
};

export const publicSubjectRouter = (subjectRepository: SubjectRepository) => {
  const router = Router();
  const controller = new SubjectController(new SubjectService(subjectRepository));
  router.get("/", validateRequest({ query: publicSubjectListQuerySchema }), asyncHandler(controller.listPublic));
  return router;
};
