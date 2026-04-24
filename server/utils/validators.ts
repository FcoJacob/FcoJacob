import { z } from 'zod'

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
  published: z.boolean(),
  locale: z.enum(['es', 'en']),
})

export const blogUpdateSchema = blogCreateSchema.partial()

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
