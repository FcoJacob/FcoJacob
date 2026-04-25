export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const { client, api } = useConvexHttpClient()
  const query = getQuery(event)
  const slug = query.slug as string

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }

  return await client.query(api.researchDocuments.getBySlug, { slug })
})
