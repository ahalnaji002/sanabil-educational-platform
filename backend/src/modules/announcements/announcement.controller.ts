import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import type { AnnouncementIdParams, AnnouncementListQuery, AnnouncementStatusBody, CreateAnnouncementBody, ReorderAnnouncementsBody, UpdateAnnouncementBody } from "./announcement.schema.js";
import type { AnnouncementService } from "./announcement.service.js";
import { commitAnnouncementImage, type AnnouncementUploadRequest } from "./announcement-upload.js";

export class AnnouncementController {
  constructor(private readonly service: AnnouncementService) {}
  listAdmin = async (req: Request, res: Response) => sendSuccess(res, 200, "Announcements retrieved successfully", { announcements: await this.service.list(req.query as AnnouncementListQuery) });
  getAdmin = async (req: Request, res: Response) => { const { id } = req.params as unknown as AnnouncementIdParams; sendSuccess(res, 200, "Announcement retrieved successfully", { announcement: await this.service.getById(id) }); };
  create = async (req: AnnouncementUploadRequest, res: Response) => {
    const announcement = await this.service.create(req.body as CreateAnnouncementBody, req.announcementImageUrl ?? null);
    commitAnnouncementImage(req);
    sendSuccess(res, 201, "Announcement created successfully", { announcement });
  };
  update = async (req: AnnouncementUploadRequest, res: Response) => {
    const { id } = req.params as unknown as AnnouncementIdParams;
    const announcement = await this.service.update(id, req.body as UpdateAnnouncementBody, req.announcementImageUrl);
    commitAnnouncementImage(req);
    sendSuccess(res, 200, "Announcement updated successfully", { announcement });
  };
  updateStatus = async (req: Request, res: Response) => { const { id } = req.params as unknown as AnnouncementIdParams; const { isActive } = req.body as AnnouncementStatusBody; sendSuccess(res, 200, "Announcement status updated successfully", { announcement: await this.service.updateStatus(id, isActive) }); };
  reorder = async (req: Request, res: Response) => { await this.service.reorder(req.body as ReorderAnnouncementsBody); sendSuccess(res, 200, "Announcements reordered successfully", null); };
  listPublic = async (_req: Request, res: Response) => sendSuccess(res, 200, "Announcements retrieved successfully", { announcements: await this.service.listPublic() });
}
