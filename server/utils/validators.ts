import { z } from 'zod'

const localizedTextSchema = z.object({
  es: z.string(),
  en: z.string(),
})

const blogResearchLinkContentSchema = z.object({
  linkLabel: localizedTextSchema,
  lead: localizedTextSchema,
  ctaLabel: localizedTextSchema,
  hint: localizedTextSchema,
  externalUrl: z.string(),
})

export const blogFooterContentSchema = z.object({
  authorEyebrow: localizedTextSchema,
  authorName: z.string().min(1).max(120),
  authorRole: localizedTextSchema,
  authorNote: localizedTextSchema,
  gratitudeNote: localizedTextSchema,
  authorImage: z.string(),
})

export const blogCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: z.string().min(1),
  excerpt: z.string().min(1).max(500),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  researchLinkContent: blogResearchLinkContentSchema.optional(),
  footerMode: z.enum(['preset', 'custom']).optional(),
  footerPresetId: z.string().min(1).optional(),
  footerContent: blogFooterContentSchema.optional(),
  published: z.boolean(),
  locale: z.enum(['es', 'en']),
})

export const blogUpdateSchema = blogCreateSchema.partial()

export const blogReactionSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  reaction: z.enum(['like', 'dislike']),
})

export const blogResearchDocumentSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(200),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  storageId: z.string().min(1),
})

export const blogFooterPresetCreateSchema = z.object({
  name: z.string().min(1).max(120),
  content: blogFooterContentSchema,
})

export const blogFooterPresetUpdateSchema = blogFooterPresetCreateSchema.partial()

export const projectCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  url: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  order: z.number().int().min(0),
})

export const projectUpdateSchema = projectCreateSchema.partial()
