import { z } from "zod";

const titleSchema = z.string().trim().min(1, "Title is required").max(180, "Title is too long");
const contentSchema = z.string().trim().min(1, "Content is required").max(20_000, "Content is too long");
const optionalText = (maximum: number, message: string) => z.string().trim().max(maximum, message).nullable().optional().transform((value) => value || null);
const optionalDateTime = z.preprocess((value) => value === "" ? null : value, z.iso.datetime({ offset: true }).nullable().optional()).transform((value) => value ?? null);
const formBoolean = z.preprocess((value) => value === "true" ? true : value === "false" ? false : value, z.boolean());
const formInteger = z.preprocess((value) => typeof value === "string" && value.trim() ? Number(value) : value, z.number().int().min(0));
const ctaUrlSchema = optionalText(2048, "CTA URL is too long").superRefine((value, context) => {
  if (!value) return;
  try {
    if (new URL(value).protocol !== "https:") context.addIssue({ code: "custom", message: "CTA URL must use HTTPS" });
  } catch {
    context.addIssue({ code: "custom", message: "CTA URL is invalid" });
  }
});

const announcementShape = {
  title: titleSchema,
  content: contentSchema,
  badge: optionalText(80, "Badge is too long"),
  ctaLabel: optionalText(120, "CTA label is too long"),
  ctaUrl: ctaUrlSchema,
  startsAt: optionalDateTime,
  endsAt: optionalDateTime,
  removeImage: formBoolean.optional().default(false),
};
const validateRelationships = (value: { ctaLabel?: string | null; ctaUrl?: string | null; startsAt?: string | null; endsAt?: string | null }, context: z.RefinementCtx) => {
  if (Boolean(value.ctaLabel) !== Boolean(value.ctaUrl)) {
    context.addIssue({ code: "custom", path: [value.ctaLabel ? "ctaUrl" : "ctaLabel"], message: "CTA label and URL must be provided together" });
  }
  if (value.startsAt && value.endsAt && new Date(value.endsAt) < new Date(value.startsAt)) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "End date must be after or equal to start date" });
  }
};

export const announcementIdParamsSchema = z.object({ id: z.coerce.number().int().positive() }).strict();
export const announcementListQuerySchema = z.object({
  status: z.enum(["active", "inactive", "all"]).default("all"),
  visibility: z.enum(["current", "scheduled", "expired", "all"]).default("all"),
}).strict();
export const createAnnouncementBodySchema = z.object({
  ...announcementShape,
  sortOrder: formInteger.optional(),
  isActive: formBoolean.default(true),
}).strict().superRefine(validateRelationships);
export const updateAnnouncementBodySchema = z.object({
  ...announcementShape,
  sortOrder: formInteger,
  isActive: formBoolean,
}).strict().superRefine(validateRelationships);
export const announcementStatusBodySchema = z.object({ isActive: z.boolean() }).strict();
export const reorderAnnouncementsBodySchema = z.object({
  items: z.array(z.object({ id: z.number().int().positive(), sortOrder: z.number().int().min(0) }).strict()).min(1),
}).strict().superRefine(({ items }, context) => {
  const ids = new Set<number>();
  items.forEach((item, index) => {
    if (ids.has(item.id)) context.addIssue({ code: "custom", path: ["items", index, "id"], message: "Duplicate Announcement IDs are not allowed" });
    ids.add(item.id);
  });
});

export type AnnouncementIdParams = z.infer<typeof announcementIdParamsSchema>;
export type AnnouncementListQuery = z.infer<typeof announcementListQuerySchema>;
export type CreateAnnouncementBody = z.infer<typeof createAnnouncementBodySchema>;
export type UpdateAnnouncementBody = z.infer<typeof updateAnnouncementBodySchema>;
export type AnnouncementStatusBody = z.infer<typeof announcementStatusBodySchema>;
export type ReorderAnnouncementsBody = z.infer<typeof reorderAnnouncementsBodySchema>;
