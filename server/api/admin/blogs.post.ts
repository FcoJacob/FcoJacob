export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readBody(event)
  const parsed = blogCreateSchema.parse(body)
  const { client, api } = useConvexHttpClient()
  return await client.mutation(api.blogs.create, parsed)
})
