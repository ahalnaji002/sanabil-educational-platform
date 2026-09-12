import type { PrismaClient } from "@prisma/client";

export type DashboardSummary = { activeGrades: number; activeSubjects: number; activeDriveLinks: number; activeAnnouncements: number };
export interface DashboardRepository { getSummary(): Promise<DashboardSummary>; }
export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly db: PrismaClient) {}
  async getSummary() {
    const [activeGrades, activeSubjects, activeDriveLinks, activeAnnouncements] = await Promise.all([
      this.db.grade.count({ where: { isActive: true } }),
      this.db.subject.count({ where: { isActive: true, grade: { isActive: true } } }),
      this.db.driveLink.count({ where: { isActive: true, subject: { isActive: true, grade: { isActive: true } } } }),
      this.db.announcement.count({ where: { isActive: true } }),
    ]);
    return { activeGrades, activeSubjects, activeDriveLinks, activeAnnouncements };
  }
}
