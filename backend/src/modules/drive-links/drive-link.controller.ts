import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import type {
  CreateDriveLinkBody,
  DriveLinkIdParams,
  DriveLinkListQuery,
  DriveLinkPublicParams,
  DriveLinkStatusBody,
  ReorderDriveLinksBody,
  UpdateDriveLinkBody,
} from "./drive-link.schema.js";
import type { DriveLinkService } from "./drive-link.service.js";

export class DriveLinkController {
  constructor(private readonly service: DriveLinkService) {}

  listAdmin = async (req: Request, res: Response) => {
    const driveLinks = await this.service.list(req.query as DriveLinkListQuery);
    sendSuccess(res, 200, "Drive links retrieved successfully", { driveLinks });
  };

  getAdmin = async (req: Request, res: Response) => {
    const { id } = req.params as unknown as DriveLinkIdParams;
    const driveLink = await this.service.getById(id);
    sendSuccess(res, 200, "Drive link retrieved successfully", { driveLink });
  };

  create = async (req: Request, res: Response) => {
    const driveLink = await this.service.create(req.body as CreateDriveLinkBody);
    sendSuccess(res, 201, "Drive link created successfully", { driveLink });
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params as unknown as DriveLinkIdParams;
    const driveLink = await this.service.update(id, req.body as UpdateDriveLinkBody);
    sendSuccess(res, 200, "Drive link updated successfully", { driveLink });
  };

  updateStatus = async (req: Request, res: Response) => {
    const { id } = req.params as unknown as DriveLinkIdParams;
    const { isActive } = req.body as DriveLinkStatusBody;
    const driveLink = await this.service.updateStatus(id, isActive);
    sendSuccess(res, 200, "Drive link status updated successfully", { driveLink });
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params as unknown as DriveLinkIdParams;
    await this.service.delete(id);
    sendSuccess(res, 200, "Drive link permanently deleted", { id });
  };

  reorder = async (req: Request, res: Response) => {
    await this.service.reorder(req.body as ReorderDriveLinksBody);
    sendSuccess(res, 200, "Drive links reordered successfully", null);
  };

  listPublic = async (req: Request, res: Response) => {
    const { slug } = req.params as unknown as DriveLinkPublicParams;
    const data = await this.service.listPublic(slug);
    sendSuccess(res, 200, "Drive links retrieved successfully", data);
  };
}
