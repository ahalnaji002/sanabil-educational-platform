import axios from "axios";
import { ApiConfigurationError, apiClient, assertApiConfigured } from "../lib/api-client";
import type { Announcement } from "../types/announcement";

type ApiSuccess<T> = { success: true; message: string; data: T };
export type AnnouncementErrorKind = "network" | "configuration" | "unexpected";
export class AnnouncementError extends Error { constructor(public readonly kind: AnnouncementErrorKind) { super(kind); this.name = "AnnouncementError"; } }
function normalize(error: unknown) { if (error instanceof ApiConfigurationError) return new AnnouncementError("configuration"); if (axios.isAxiosError(error) && !error.response) return new AnnouncementError("network"); return new AnnouncementError("unexpected"); }
export const announcementService = {
  async getActiveAnnouncements(): Promise<Announcement[]> {
    try { assertApiConfigured(); return (await apiClient.get<ApiSuccess<{ announcements: Announcement[] }>>("/api/public/announcements")).data.data.announcements; }
    catch (error) { throw normalize(error); }
  },
};
