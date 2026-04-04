export default defineEventHandler(async (event) => {
  const { client, api } = useConvexHttpClient()
  const query = getQuery(event)
  const slug = query.slug as string
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }
  return await client.query(api.blogs.getBySlug, { slug })
})
