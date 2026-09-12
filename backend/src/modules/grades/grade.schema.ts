import { z } from "zod";

export const gradeStatusSchema = z.enum(["active", "inactive", "all"]);
const nameSchema = z.string().trim().min(1, "Name is required").max(120, "Name is too long");
export const gradeSlugSchema = z.string().trim().toLowerCase().min(1, "Slug is required").max(160, "Slug is too long").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain lowercase letters, numbers, and single hyphens only");

export const gradeIdParamsSchema = z.object({ id: z.coerce.number().int().positive() }).strict();
export const gradeListQuerySchema = z.object({ status: gradeStatusSchema.default("all") }).strict();
export const createGradeBodySchema = z.object({
  name: nameSchema,
  slug: gradeSlugSchema,
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
}).strict();
export const updateGradeBodySchema = z.object({
  name: nameSchema,
  slug: gradeSlugSchema,
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
}).strict();
export const gradeStatusBodySchema = z.object({ isActive: z.boolean() }).strict();
export const reorderGradesBodySchema = z.object({
  items: z.array(z.object({ id: z.number().int().positive(), sortOrder: z.number().int().min(0) }).strict()).min(1),
}).strict().superRefine(({ items }, context) => {
  const ids = new Set<number>();
  items.forEach((item, index) => {
    if (ids.has(item.id)) context.addIssue({ code: "custom", path: ["items", index, "id"], message: "Duplicate Grade IDs are not allowed" });
    ids.add(item.id);
  });
});

export type GradeIdParams = z.infer<typeof gradeIdParamsSchema>;
export type GradeListQuery = z.infer<typeof gradeListQuerySchema>;
export type CreateGradeBody = z.infer<typeof createGradeBodySchema>;
export type UpdateGradeBody = z.infer<typeof updateGradeBodySchema>;
export type GradeStatusBody = z.infer<typeof gradeStatusBodySchema>;
export type ReorderGradesBody = z.infer<typeof reorderGradesBodySchema>;
