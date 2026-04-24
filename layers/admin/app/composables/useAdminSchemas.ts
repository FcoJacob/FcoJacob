import { z } from 'zod'

export function useAdminSchemas() {
  const blogSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().min(1, 'Excerpt is required'),
    coverImage: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
    published: z.boolean(),
    locale: z.enum(['es', 'en']),
  })

  const projectSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
    thumbnail: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
    tags: z.string(),
    isActive: z.boolean(),
    order: z.number().int().min(0),
  })

  return { blogSchema, projectSchema }
}
