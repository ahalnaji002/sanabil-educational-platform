import type { PublicGrade } from "./grade";

export type PublicSubject = { id: number; name: string; slug: string; grade: Pick<PublicGrade, "id" | "name" | "slug"> };
export type PublicDriveLink = { id: number; title: string; description: string | null; driveUrl: string; sortOrder: number };
export type PublicDriveLinksResult = { subject: PublicSubject; driveLinks: PublicDriveLink[] };
