export type AdminRole = "SUPER_ADMIN" | "ADMIN";

export type Admin = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
};
