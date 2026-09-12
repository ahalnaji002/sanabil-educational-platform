import { Router } from "express";
import type { AppConfig } from "../../config/env.js";
import { authenticateAdmin } from "../../middlewares/authenticate-admin.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { AdminRepository } from "../auth/auth.repository.js";
import { DashboardController } from "./dashboard.controller.js";
import type { DashboardRepository } from "./dashboard.repository.js";
import { DashboardService } from "./dashboard.service.js";
export const dashboardRouter = (config: AppConfig, admins: AdminRepository, repository: DashboardRepository) => { const router = Router(); const controller = new DashboardController(new DashboardService(repository)); router.use(authenticateAdmin(config, admins)); router.get("/summary", asyncHandler(controller.summary)); return router; };
