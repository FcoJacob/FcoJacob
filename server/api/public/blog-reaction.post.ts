export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = blogReactionSchema.parse(body)
  const { client, api } = useConvexHttpClient()

  return await client.mutation(api.blogs.react, parsed)
})
