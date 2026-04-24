export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readBody(event)
  const parsed = projectCreateSchema.parse(body)
  const { client, api } = useConvexHttpClient()
  return await client.mutation(api.projects.create, parsed)
})
