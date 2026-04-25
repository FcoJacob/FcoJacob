import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const upsertForSlug = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('researchDocuments')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()

    const now = Date.now()

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert('researchDocuments', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const document = await ctx.db
      .query('researchDocuments')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()

    if (!document) {
      return null
    }

    const url = await ctx.storage.getUrl(document.storageId)

    return {
      ...document,
      url,
    }
  },
})
