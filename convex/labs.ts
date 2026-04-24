import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

export const list = query({
  args: {
    onlyPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.onlyPublished) {
      return await ctx.db
        .query('labs')
        .withIndex('by_published', (q) => q.eq('published', true))
        .order('desc')
        .collect()
    }
    return await ctx.db.query('labs').order('desc').collect()
  },
})

export const getById = query({
  args: { id: v.id('labs') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    url: v.optional(v.string()),
    tags: v.array(v.string()),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('labs', {
      ...args,
      createdAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('labs'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args
    const updates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value
    }
    await ctx.db.patch(id, updates)
  },
})

export const remove = mutation({
  args: { id: v.id('labs') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
