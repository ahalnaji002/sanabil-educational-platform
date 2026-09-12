import axios from "axios";
import { ApiConfigurationError, apiClient, assertApiConfigured } from "../lib/api-client";
export type DashboardSummary = { activeGrades: number; activeSubjects: number; activeDriveLinks: number; activeAnnouncements: number };
export class AdminDashboardError extends Error { constructor(public readonly kind: "unauthorized" | "network" | "configuration" | "unexpected") { super(kind); } }
export const adminDashboardService = { async getSummary() { try { assertApiConfigured(); return (await apiClient.get<{ data: DashboardSummary }>("/api/admin/dashboard/summary")).data.data; } catch (error) { if (error instanceof ApiConfigurationError) throw new AdminDashboardError("configuration"); if (axios.isAxiosError(error)) { if (!error.response) throw new AdminDashboardError("network"); if (error.response.status === 401) throw new AdminDashboardError("unauthorized"); } throw new AdminDashboardError("unexpected"); } } };
