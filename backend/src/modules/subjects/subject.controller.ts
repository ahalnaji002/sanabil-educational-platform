import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import type {
  CreateSubjectBody,
  SubjectIdParams,
  SubjectListQuery,
  UpdateSubjectBody,
} from "./subject.schema.js";
import type { SubjectService } from "./subject.service.js";

export class SubjectController {
  constructor(private readonly service: SubjectService) {}

  listAdmin = async (req: Request, res: Response) => {
    const subjects = await this.service.list(req.query as SubjectListQuery);
    sendSuccess(res, 200, "Subjects retrieved successfully", { subjects });
  };

  getAdmin = async (req: Request, res: Response) => {
    const { id } = req.params as unknown as SubjectIdParams;
    const subject = await this.service.getById(id);
    sendSuccess(res, 200, "Subject retrieved successfully", { subject });
  };

  create = async (req: Request, res: Response) => {
    const subject = await this.service.create(req.body as CreateSubjectBody);
    sendSuccess(res, 201, "Subject created successfully", { subject });
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params as unknown as SubjectIdParams;
    const subject = await this.service.update(id, req.body as UpdateSubjectBody);
    sendSuccess(res, 200, "Subject updated successfully", { subject });
  };

  deactivate = async (req: Request, res: Response) => {
    const { id } = req.params as unknown as SubjectIdParams;
    const subject = await this.service.deactivate(id);
    sendSuccess(res, 200, "Subject deactivated successfully", { subject });
  };

  listPublic = async (req: Request, res: Response) => {
    const subjects = await this.service.listPublic(req.query);
    sendSuccess(res, 200, "Subjects retrieved successfully", { subjects });
  };
}
