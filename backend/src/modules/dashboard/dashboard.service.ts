import type { DashboardRepository } from "./dashboard.repository.js";
export class DashboardService { constructor(private readonly repository: DashboardRepository) {} getSummary() { return this.repository.getSummary(); } }
