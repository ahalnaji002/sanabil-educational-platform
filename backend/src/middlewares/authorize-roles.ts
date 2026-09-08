import type { AdminRole } from "@prisma/client";
import type { RequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";
export const authorizeRoles = (...roles: AdminRole[]): RequestHandler => (req, _res, next) => {
  if (!req.admin) { next(new ApiError(401, "Authentication required")); return; }
  if (!roles.includes(req.admin.role)) { next(new ApiError(403, "Forbidden")); return; }
  next();
};
