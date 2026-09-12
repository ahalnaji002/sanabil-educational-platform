import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

export class ApiConfigurationError extends Error {
  constructor() {
    super("NEXT_PUBLIC_API_URL is not configured");
    this.name = "ApiConfigurationError";
  }
}

export function assertApiConfigured() {
  if (!apiUrl) throw new ApiConfigurationError();
}

export const apiClient = axios.create({
  ...(apiUrl ? { baseURL: apiUrl } : {}),
  withCredentials: true,
  timeout: 12_000,
  headers: { Accept: "application/json" },
});
