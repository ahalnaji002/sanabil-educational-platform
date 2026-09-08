import jwt from "jsonwebtoken";
import { z } from "zod";
import type { AppConfig } from "../../config/env.js";
import type { SafeAdmin } from "./auth.types.js";
const payload = z.object({ sub: z.string().regex(/^\d+$/), role: z.enum(["SUPER_ADMIN", "ADMIN"]) });
export const signToken = (admin: SafeAdmin, config: AppConfig) => jwt.sign(
  { role: admin.role }, config.JWT_SECRET,
  { subject: String(admin.id), expiresIn: Math.floor(config.jwtMaxAgeMs / 1000) },
);
export const verifyToken = (token: string, config: AppConfig) => payload.parse(jwt.verify(token, config.JWT_SECRET));
