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
import { sendSuccess } from "./utils/response.js";

export const createApp = (
  config: AppConfig,
  repo: AdminRepository,
  subjectRepository: SubjectRepository = new PrismaSubjectRepository(prisma),
  driveLinkRepository: DriveLinkRepository = new PrismaDriveLinkRepository(prisma),
) => {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_request, response) => {
    sendSuccess(response, 200, "Service is healthy", { status: "ok" });
  });
  app.use("/api/auth", authRouter(config, repo));
  app.use("/api/admin/subjects", adminSubjectRouter(config, repo, subjectRepository));
  app.use("/api/admin/drive-links", adminDriveLinkRouter(config, repo, driveLinkRepository, subjectRepository));
  app.use("/api/public/subjects", publicSubjectRouter(subjectRepository));
  app.use("/api/public/subjects", publicDriveLinkRouter(driveLinkRepository, subjectRepository));
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
