import type { Response } from "express";
import type { ErrorFields } from "./api-error.js";
export const sendSuccess = (res: Response, status: number, message: string, data: unknown) =>
  res.status(status).json({ success: true, message, data });
export const sendError = (res: Response, status: number, message: string, errors?: ErrorFields) =>
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
