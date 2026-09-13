import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import type { AppConfig } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFound } from "./middlewares/not-found.js";
import type { AdminRepository } from "./modules/auth/auth.repository.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { prisma } from "./config/prisma.js";
import { PrismaSubjectRepository, type SubjectRepository } from "./modules/subjects/subject.repository.js";
import { adminSubjectRouter, publicSubjectRouter } from "./modules/subjects/subject.routes.js";
import { PrismaDriveLinkRepository, type DriveLinkRepository } from "./modules/drive-links/drive-link.repository.js";
import { adminDriveLinkRouter, publicDriveLinkRouter } from "./modules/drive-links/drive-link.routes.js";
import { PrismaGradeRepository, type GradeRepository } from "./modules/grades/grade.repository.js";
import { adminGradeRouter, publicGradeRouter } from "./modules/grades/grade.routes.js";
import { sendSuccess } from "./utils/response.js";
import { PrismaAnnouncementRepository, type AnnouncementRepository } from "./modules/announcements/announcement.repository.js";
import { adminAnnouncementRouter, publicAnnouncementRouter } from "./modules/announcements/announcement.routes.js";
import { PrismaProfileRepository, type ProfileRepository } from "./modules/profile/profile.repository.js";
import { profileRouter } from "./modules/profile/profile.routes.js";
import { PrismaDashboardRepository, type DashboardRepository } from "./modules/dashboard/dashboard.repository.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { announcementUploadDirectory, announcementUploadPublicPath } from "./modules/announcements/announcement-upload.js";
import { createGeneralApiRateLimiter } from "./middlewares/rate-limiters.js";

export const createApp = (
  config: AppConfig,
  repo: AdminRepository,
  subjectRepository: SubjectRepository = new PrismaSubjectRepository(prisma),
  driveLinkRepository: DriveLinkRepository = new PrismaDriveLinkRepository(prisma),
  gradeRepository: GradeRepository = new PrismaGradeRepository(prisma),
  announcementRepository: AnnouncementRepository = new PrismaAnnouncementRepository(prisma),
  profileRepository: ProfileRepository = new PrismaProfileRepository(prisma),
  dashboardRepository: DashboardRepository = new PrismaDashboardRepository(prisma),
) => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: config.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(announcementUploadPublicPath, express.static(announcementUploadDirectory, {
    dotfiles: "deny",
    index: false,
    maxAge: "7d",
    setHeaders: (response) => response.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
  }));

  app.get("/api/health", (_request, response) => {
    sendSuccess(response, 200, "Service is healthy", { status: "ok" });
  });
  app.use("/api", createGeneralApiRateLimiter());
  app.use("/api/auth", authRouter(config, repo));
  app.use("/api/admin/grades", adminGradeRouter(config, repo, gradeRepository));
  app.use("/api/admin/subjects", adminSubjectRouter(config, repo, subjectRepository, gradeRepository));
  app.use("/api/admin/drive-links", adminDriveLinkRouter(config, repo, driveLinkRepository, subjectRepository));
  app.use("/api/admin/announcements", adminAnnouncementRouter(config, repo, announcementRepository));
  app.use("/api/admin/profile", profileRouter(config, repo, profileRepository));
  app.use("/api/admin/dashboard", dashboardRouter(config, repo, dashboardRepository));
  app.use("/api/public/grades", publicGradeRouter(gradeRepository));
  app.use("/api/public/subjects", publicSubjectRouter(subjectRepository, gradeRepository));
  app.use("/api/public/subjects", publicDriveLinkRouter(driveLinkRepository, subjectRepository));
  app.use("/api/public/announcements", publicAnnouncementRouter(announcementRepository));
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
