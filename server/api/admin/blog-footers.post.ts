export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const body = await readBody(event)
  const parsed = blogFooterPresetCreateSchema.parse(body)
  const { client, api } = useConvexHttpClient()

  return await client.mutation(api.blogFooters.create, parsed as never)
})
