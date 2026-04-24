import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const profileValidator = v.object({
  network: v.string(),
  username: v.string(),
  url: v.string(),
})

const locationValidator = v.object({
  address: v.optional(v.string()),
  postalCode: v.optional(v.string()),
  city: v.string(),
  countryCode: v.string(),
  region: v.string(),
})

const basicsValidator = v.object({
  name: v.string(),
  label: v.string(),
  image: v.optional(v.string()),
  email: v.string(),
  phone: v.optional(v.string()),
  url: v.optional(v.string()),
  summary: v.string(),
  location: locationValidator,
  profiles: v.array(profileValidator),
})

const workValidator = v.object({
  name: v.string(),
  position: v.string(),
  url: v.optional(v.string()),
  startDate: v.string(),
  endDate: v.optional(v.union(v.string(), v.null())),
  summary: v.string(),
  highlights: v.array(v.string()),
})

const educationValidator = v.object({
  institution: v.string(),
  url: v.optional(v.string()),
  area: v.string(),
  studyType: v.string(),
  startDate: v.string(),
  endDate: v.optional(v.string()),
  score: v.optional(v.string()),
  courses: v.optional(v.array(v.string())),
})

const skillValidator = v.object({
  name: v.string(),
  level: v.string(),
  keywords: v.array(v.string()),
})

const languageValidator = v.object({
  language: v.string(),
  fluency: v.string(),
})

const cvProjectValidator = v.object({
  name: v.string(),
  isActive: v.optional(v.boolean()),
  description: v.string(),
  highlights: v.array(v.string()),
  url: v.optional(v.string()),
  github: v.optional(v.string()),
})

export default defineSchema({
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
  })
    .index('by_slug', ['slug'])
    .index('by_locale', ['locale'])
    .index('by_published', ['published']),

  projects: defineTable({
    name: v.string(),
    description: v.string(),
    url: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    tags: v.array(v.string()),
    isActive: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
  }).index('by_order', ['order']),

  labs: defineTable({
    name: v.string(),
    description: v.string(),
    url: v.optional(v.string()),
    tags: v.array(v.string()),
    published: v.boolean(),
    createdAt: v.number(),
  }).index('by_published', ['published']),

  cv: defineTable({
    basics: basicsValidator,
    work: v.array(workValidator),
    education: v.array(educationValidator),
    skills: v.array(skillValidator),
    languages: v.array(languageValidator),
    projects: v.array(cvProjectValidator),
  }),
})
