import type { Grade } from "./admin-subject";

export type PublicSubject = { id: number; name: string; slug: string; grade: Grade };
export type PublicDriveLink = { id: number; title: string; description: string | null; driveUrl: string; sortOrder: number };
export type PublicDriveLinksResult = { subject: PublicSubject; driveLinks: PublicDriveLink[] };
