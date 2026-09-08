import { Router } from "express";
import { z } from "zod";
import type { AppConfig } from "../../config/env.js";
import { authenticateAdmin } from "../../middlewares/authenticate-admin.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import type { AdminRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { signToken } from "./auth.tokens.js";
const loginSchema = z.object({ email: z.email("Invalid email").transform((v) => v.trim().toLowerCase()), password: z.string().min(1) }).strict();
export const authRouter = (config: AppConfig, repo: AdminRepository) => {
  const router = Router(); const service = new AuthService(repo);
  const cookie = { httpOnly: true, secure: config.NODE_ENV === "production", sameSite: config.COOKIE_SAME_SITE, path: "/" } as const;
  router.post("/login", validateRequest({ body: loginSchema }), asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof loginSchema>; const admin = await service.login(body.email, body.password);
    res.cookie(config.AUTH_COOKIE_NAME, signToken(admin, config), { ...cookie, maxAge: config.jwtMaxAgeMs });
    sendSuccess(res, 200, "Login successful", { admin });
  }));
  router.post("/logout", (_req, res) => { res.clearCookie(config.AUTH_COOKIE_NAME, cookie); sendSuccess(res, 200, "Logout successful", {}); });
  router.get("/me", authenticateAdmin(config, repo), (req, res) => { sendSuccess(res, 200, "Admin retrieved successfully", { admin: req.admin }); });
  return router;
};
