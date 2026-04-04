import { describe, it, expect } from 'vitest'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

describe('convex schema', () => {
  it('defines blogs table with required fields', () => {
    const schema = defineSchema({
      blogs: defineTable({
        title: v.string(),
        slug: v.string(),
        content: v.string(),
        excerpt: v.string(),
        coverImage: v.optional(v.string()),
        published: v.boolean(),
        locale: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    })
    expect(schema).toBeDefined()
  })

  it('defines cv table with nested validators', () => {
    const schema = defineSchema({
      cv: defineTable({
        basics: v.object({
          name: v.string(),
          label: v.string(),
          email: v.string(),
          summary: v.string(),
          location: v.object({
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
        work: v.array(v.object({
          name: v.string(),
          position: v.string(),
          startDate: v.string(),
          summary: v.string(),
          highlights: v.array(v.string()),
        })),
        education: v.array(v.object({
          institution: v.string(),
          area: v.string(),
          studyType: v.string(),
          startDate: v.string(),
        })),
        skills: v.array(v.object({
          name: v.string(),
          level: v.string(),
          keywords: v.array(v.string()),
        })),
        languages: v.array(v.object({
          language: v.string(),
          fluency: v.string(),
        })),
        projects: v.array(v.object({
          name: v.string(),
          description: v.string(),
          highlights: v.array(v.string()),
        })),
      }),
    })
    expect(schema).toBeDefined()
  })
})
