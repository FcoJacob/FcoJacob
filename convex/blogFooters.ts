import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { blogFooterContentValidator } from './blogValidators'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('blogFooters').order('desc').collect()
  },
})

export const getById = query({
  args: { id: v.id('blogFooters') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    content: blogFooterContentValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    return await ctx.db.insert('blogFooters', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('blogFooters'),
    name: v.optional(v.string()),
    content: v.optional(blogFooterContentValidator),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args
    const updates: Record<string, unknown> = { updatedAt: Date.now() }

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value
      }
    }

    await ctx.db.patch(id, updates)
  },
})

export const remove = mutation({
  args: { id: v.id('blogFooters') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
