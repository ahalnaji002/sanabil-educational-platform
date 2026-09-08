import type { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";
import { sendError } from "../utils/response.js";
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof SyntaxError && "status" in error && error.status === 400) sendError(res, 400, "Malformed JSON");
  else if (error instanceof ApiError) sendError(res, error.statusCode, error.message, error.errors);
  else {
    if (process.env.NODE_ENV !== "production") console.error(error);
    sendError(res, 500, "Internal server error");
  }
};
