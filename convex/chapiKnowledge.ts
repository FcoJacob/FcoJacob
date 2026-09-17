import { v } from 'convex/values'
import { internalMutation, internalQuery } from './_generated/server'

const knowledgeChunkValidator = v.object({
  text: v.string(),
  embedding: v.array(v.number()),
})

const SOURCE = 'cv'

export const getChunks = internalQuery({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query('chapiKnowledge')
      .withIndex('by_source', (q) => q.eq('source', SOURCE))
      .first()
    return doc?.chunks ?? null
  },
})

export const save = internalMutation({
  args: { chunks: v.array(knowledgeChunkValidator) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('chapiKnowledge')
      .withIndex('by_source', (q) => q.eq('source', SOURCE))
      .first()
    const docData = { source: SOURCE, chunks: args.chunks, updatedAt: Date.now() }
    if (existing) {
      await ctx.db.replace(existing._id, docData)
      return existing._id
    }
    return await ctx.db.insert('chapiKnowledge', docData)
  },
})
