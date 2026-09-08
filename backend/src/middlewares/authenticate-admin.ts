import type { RequestHandler } from "express";
import type { AppConfig } from "../config/env.js";
import type { AdminRepository } from "../modules/auth/auth.repository.js";
import { AuthService } from "../modules/auth/auth.service.js";
import { verifyToken } from "../modules/auth/auth.tokens.js";
import { ApiError } from "../utils/api-error.js";
export const authenticateAdmin = (config: AppConfig, repo: AdminRepository): RequestHandler => {
  const service = new AuthService(repo);
  return async (req, _res, next) => {
    try {
      const cookies = req.cookies as Record<string, unknown>;
      const token = cookies[config.AUTH_COOKIE_NAME];
      if (typeof token !== "string") throw new Error();
      const claims = verifyToken(token, config);
      req.admin = await service.current(Number(claims.sub));
      next();
    } catch { next(new ApiError(401, "Authentication required")); }
  };
};
