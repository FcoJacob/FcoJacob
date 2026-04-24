export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const parsed = projectUpdateSchema.parse(body)
  const { client, api } = useConvexHttpClient()
  return await client.mutation(api.projects.update, { id, ...parsed })
})
