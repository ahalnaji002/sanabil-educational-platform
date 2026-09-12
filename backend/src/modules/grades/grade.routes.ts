import { Router } from "express";
import type { AppConfig } from "../../config/env.js";
import { authenticateAdmin } from "../../middlewares/authenticate-admin.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { AdminRepository } from "../auth/auth.repository.js";
import { GradeController } from "./grade.controller.js";
import type { GradeRepository } from "./grade.repository.js";
import { createGradeBodySchema, gradeIdParamsSchema, gradeListQuerySchema, gradeStatusBodySchema, reorderGradesBodySchema, updateGradeBodySchema } from "./grade.schema.js";
import { GradeService } from "./grade.service.js";

const controllerFor = (repository: GradeRepository) => new GradeController(new GradeService(repository));
export const adminGradeRouter = (config: AppConfig, adminRepository: AdminRepository, repository: GradeRepository) => {
  const router = Router(); const controller = controllerFor(repository);
  router.use(authenticateAdmin(config, adminRepository));
  router.get("/", validateRequest({ query: gradeListQuerySchema }), asyncHandler(controller.listAdmin));
  router.post("/", validateRequest({ body: createGradeBodySchema }), asyncHandler(controller.create));
  router.patch("/reorder", validateRequest({ body: reorderGradesBodySchema }), asyncHandler(controller.reorder));
  router.get("/:id", validateRequest({ params: gradeIdParamsSchema }), asyncHandler(controller.getAdmin));
  router.put("/:id", validateRequest({ params: gradeIdParamsSchema, body: updateGradeBodySchema }), asyncHandler(controller.update));
  router.patch("/:id/status", validateRequest({ params: gradeIdParamsSchema, body: gradeStatusBodySchema }), asyncHandler(controller.updateStatus));
  return router;
};
export const publicGradeRouter = (repository: GradeRepository) => { const router = Router(); const controller = controllerFor(repository); router.get("/", asyncHandler(controller.listPublic)); return router; };
