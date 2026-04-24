import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

export const list = query({
  args: {
    locale: v.optional(v.string()),
    onlyPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const blogs = args.onlyPublished
      ? await ctx.db
          .query('blogs')
          .withIndex('by_published', (q) => q.eq('published', true))
          .order('desc')
          .collect()
      : await ctx.db.query('blogs').order('desc').collect()

    if (args.locale) {
      return blogs.filter((b) => b.locale === args.locale)
    }
    return blogs
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('blogs')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
  },
})

export const getById = query({
  args: { id: v.id('blogs') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    excerpt: v.string(),
    coverImage: v.optional(v.string()),
    published: v.boolean(),
    locale: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('blogs', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('blogs'),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    published: v.optional(v.boolean()),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args
    const updates: Record<string, unknown> = { updatedAt: Date.now() }
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value
    }
    await ctx.db.patch(id, updates)
  },
})

export const remove = mutation({
  args: { id: v.id('blogs') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
