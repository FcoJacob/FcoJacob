import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query('cv').first()
  },
})

export const upsert = mutation({
  args: {
    basics: v.object({
      name: v.string(),
      label: v.string(),
      image: v.optional(v.string()),
      email: v.string(),
      phone: v.optional(v.string()),
      url: v.optional(v.string()),
      summary: v.string(),
      location: v.object({
        address: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        city: v.string(),
        countryCode: v.string(),
        region: v.string(),
      }),
      profiles: v.array(
        v.object({
          network: v.string(),
          username: v.string(),
          url: v.string(),
        }),
      ),
    }),
    work: v.array(
      v.object({
        name: v.string(),
        position: v.string(),
        url: v.optional(v.string()),
        startDate: v.string(),
        endDate: v.optional(v.union(v.string(), v.null())),
        summary: v.string(),
        highlights: v.array(v.string()),
      }),
    ),
    education: v.array(
      v.object({
        institution: v.string(),
        url: v.optional(v.string()),
        area: v.string(),
        studyType: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        score: v.optional(v.string()),
        courses: v.optional(v.array(v.string())),
      }),
    ),
    skills: v.array(
      v.object({
        name: v.string(),
        level: v.string(),
        keywords: v.array(v.string()),
      }),
    ),
    languages: v.array(
      v.object({
        language: v.string(),
        fluency: v.string(),
      }),
    ),
    projects: v.array(
      v.object({
        name: v.string(),
        isActive: v.optional(v.boolean()),
        description: v.string(),
        highlights: v.array(v.string()),
        url: v.optional(v.string()),
        github: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('cv').first()
    if (existing) {
      await ctx.db.replace(existing._id, args)
      return existing._id
    }
    return await ctx.db.insert('cv', args)
  },
})
