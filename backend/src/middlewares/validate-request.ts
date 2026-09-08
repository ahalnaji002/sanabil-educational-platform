import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError, type ErrorFields } from "../utils/api-error.js";
type Schemas = Partial<Record<"body" | "params" | "query", ZodType>>;
export const validateRequest = (schemas: Schemas): RequestHandler => (req, _res, next) => {
  for (const key of ["body", "params", "query"] as const) {
    const schema = schemas[key];
    if (!schema) continue;
    const result = schema.safeParse(req[key]);
    if (!result.success) {
      const errors: ErrorFields = {};
      for (const issue of result.error.issues) errors[issue.path.join(".") || key] ??= issue.message;
      next(new ApiError(400, "Validation failed", errors));
      return;
    }
    Object.assign(req[key], result.data);
  }
  next();
};
