import { z } from "zod";
import { subjectStatusSchema } from "../subjects/subject.schema.js";

const titleSchema = z.string().trim().min(1, "Title is required").max(160, "Title is too long");
const descriptionSchema = z.string().trim().max(4000, "Description is too long").nullable().optional()
  .transform((value) => value && value.length > 0 ? value : null);
const driveUrlSchema = z.string().trim().max(2048, "URL is too long").superRefine((value, context) => {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") context.addIssue({ code: "custom", message: "Google Drive URL must use HTTPS" });
    if (url.hostname.toLowerCase() !== "drive.google.com") context.addIssue({ code: "custom", message: "Only drive.google.com URLs are allowed" });
  } catch {
    context.addIssue({ code: "custom", message: "Drive URL is invalid" });
  }
});

export const driveLinkIdParamsSchema = z.object({ id: z.coerce.number().int().positive() }).strict();
export const driveLinkPublicParamsSchema = z.object({
  slug: z.string().trim().toLowerCase().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
}).strict();
export const driveLinkListQuerySchema = z.object({
  subjectId: z.coerce.number().int().positive().optional(),
  status: subjectStatusSchema.default("all"),
  gradeId: z.coerce.number().int().positive().optional(),
}).strict();
export const createDriveLinkBodySchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  subjectId: z.number().int().positive(),
  driveUrl: driveUrlSchema,
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
}).strict();
export const updateDriveLinkBodySchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  subjectId: z.number().int().positive(),
  driveUrl: driveUrlSchema,
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
}).strict();
export const driveLinkStatusBodySchema = z.object({ isActive: z.boolean() }).strict();
export const reorderDriveLinksBodySchema = z.object({
  subjectId: z.number().int().positive(),
  items: z.array(z.object({ id: z.number().int().positive(), sortOrder: z.number().int().min(0) }).strict()).min(1),
}).strict().superRefine(({ items }, context) => {
  const ids = new Set<number>();
  items.forEach((item, index) => {
    if (ids.has(item.id)) context.addIssue({ code: "custom", path: ["items", index, "id"], message: "Duplicate link IDs are not allowed" });
    ids.add(item.id);
  });
});

export type DriveLinkIdParams = z.infer<typeof driveLinkIdParamsSchema>;
export type DriveLinkPublicParams = z.infer<typeof driveLinkPublicParamsSchema>;
export type DriveLinkListQuery = z.infer<typeof driveLinkListQuerySchema>;
export type CreateDriveLinkBody = z.infer<typeof createDriveLinkBodySchema>;
export type UpdateDriveLinkBody = z.infer<typeof updateDriveLinkBodySchema>;
export type DriveLinkStatusBody = z.infer<typeof driveLinkStatusBodySchema>;
export type ReorderDriveLinksBody = z.infer<typeof reorderDriveLinksBodySchema>;
