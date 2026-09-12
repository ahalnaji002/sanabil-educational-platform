import { z } from "zod";

export const subjectStatusSchema = z.enum(["active", "inactive", "all"]);

const nameSchema = z.string().trim().min(1, "Name is required").max(120, "Name is too long");
const slugSchema = z.string()
  .trim()
  .toLowerCase()
  .min(1, "Slug is required")
  .max(160, "Slug is too long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain lowercase letters, numbers, and single hyphens only");

export const subjectIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
}).strict();

export const subjectListQuerySchema = z.object({
  status: subjectStatusSchema.default("all"),
  gradeId: z.coerce.number().int().positive().optional(),
}).strict();

export const publicSubjectListQuerySchema = z.object({
  grade: z.string().trim().toLowerCase().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
}).strict();

export const createSubjectBodySchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  gradeId: z.number().int().positive(),
  isActive: z.boolean().default(true),
}).strict();

export const updateSubjectBodySchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  gradeId: z.number().int().positive(),
  isActive: z.boolean(),
}).strict();

export type SubjectIdParams = z.infer<typeof subjectIdParamsSchema>;
export type SubjectListQuery = z.infer<typeof subjectListQuerySchema>;
export type PublicSubjectListQuery = z.infer<typeof publicSubjectListQuerySchema>;
export type CreateSubjectBody = z.infer<typeof createSubjectBodySchema>;
export type UpdateSubjectBody = z.infer<typeof updateSubjectBodySchema>;
