import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import type { DashboardService } from "./dashboard.service.js";
export class DashboardController { constructor(private readonly service: DashboardService) {} summary = async (_req: Request, res: Response) => sendSuccess(res, 200, "Dashboard summary retrieved successfully", await this.service.getSummary()); }
