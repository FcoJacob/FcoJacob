import { v } from 'convex/values'

export const localizedTextValidator = v.object({
  es: v.string(),
  en: v.string(),
})

export const blogResearchLinkContentValidator = v.object({
  linkLabel: localizedTextValidator,
  lead: localizedTextValidator,
  ctaLabel: localizedTextValidator,
  hint: localizedTextValidator,
  externalUrl: v.string(),
})

export const blogFooterContentValidator = v.object({
  authorEyebrow: localizedTextValidator,
  authorName: v.string(),
  authorRole: localizedTextValidator,
  authorNote: localizedTextValidator,
  gratitudeNote: localizedTextValidator,
  authorImage: v.string(),
})
