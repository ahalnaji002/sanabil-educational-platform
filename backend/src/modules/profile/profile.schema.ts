import { z } from "zod";

export const updateProfileBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  email: z.email("Invalid email").transform((value) => value.trim().toLowerCase()),
}).strict();
export const updatePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must include an uppercase letter").regex(/[a-z]/, "Password must include a lowercase letter").regex(/[0-9]/, "Password must include a digit"),
  passwordConfirmation: z.string().min(1, "Password confirmation is required"),
}).strict().refine((value) => value.newPassword === value.passwordConfirmation, { path: ["passwordConfirmation"], message: "Password confirmation does not match" });

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
export type UpdatePasswordBody = z.infer<typeof updatePasswordBodySchema>;
