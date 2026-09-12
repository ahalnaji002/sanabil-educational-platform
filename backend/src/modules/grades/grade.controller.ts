import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import type { CreateGradeBody, GradeIdParams, GradeListQuery, GradeStatusBody, ReorderGradesBody, UpdateGradeBody } from "./grade.schema.js";
import type { GradeService } from "./grade.service.js";

export class GradeController {
  constructor(private readonly service: GradeService) {}
  listAdmin = async (req: Request, res: Response) => { sendSuccess(res, 200, "Grades retrieved successfully", { grades: await this.service.list(req.query as GradeListQuery) }); };
  getAdmin = async (req: Request, res: Response) => { const { id } = req.params as unknown as GradeIdParams; sendSuccess(res, 200, "Grade retrieved successfully", { grade: await this.service.getById(id) }); };
  create = async (req: Request, res: Response) => { sendSuccess(res, 201, "Grade created successfully", { grade: await this.service.create(req.body as CreateGradeBody) }); };
  update = async (req: Request, res: Response) => { const { id } = req.params as unknown as GradeIdParams; sendSuccess(res, 200, "Grade updated successfully", { grade: await this.service.update(id, req.body as UpdateGradeBody) }); };
  updateStatus = async (req: Request, res: Response) => { const { id } = req.params as unknown as GradeIdParams; const { isActive } = req.body as GradeStatusBody; sendSuccess(res, 200, "Grade status updated successfully", { grade: await this.service.updateStatus(id, isActive) }); };
  reorder = async (req: Request, res: Response) => { await this.service.reorder(req.body as ReorderGradesBody); sendSuccess(res, 200, "Grades reordered successfully", null); };
  listPublic = async (_req: Request, res: Response) => { sendSuccess(res, 200, "Grades retrieved successfully", { grades: await this.service.listPublic() }); };
}
