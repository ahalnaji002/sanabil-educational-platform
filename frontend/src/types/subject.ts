export type DriveDestination = {
  id: number;
  title: string;
  description: string | null;
  driveUrl: string | null;
  sortOrder: number;
};

export type Subject = {
  id: number;
  name: string;
  slug: string;
  summary: string;
  icon: "calculator" | "atom" | "flask" | "book" | "language" | "biology" | "technology";
  links: DriveDestination[];
};
