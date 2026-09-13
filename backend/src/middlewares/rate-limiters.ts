import rateLimit from "express-rate-limit";
import { sendError } from "../utils/response.js";

const WINDOW_MS = 15 * 60 * 1_000;
export const LOGIN_RATE_LIMIT_MAX = 5;
export const GENERAL_API_RATE_LIMIT_MAX = 200;

const sharedOptions = {
  windowMs: WINDOW_MS,
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
};

export const createLoginRateLimiter = () => rateLimit({
  ...sharedOptions,
  limit: LOGIN_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,
  handler: (_request, response) => sendError(response, 429, "Too many login attempts. Please try again later."),
});

export const createGeneralApiRateLimiter = () => rateLimit({
  ...sharedOptions,
  limit: GENERAL_API_RATE_LIMIT_MAX,
  handler: (_request, response) => sendError(response, 429, "Too many requests. Please try again later."),
});
