export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const { client, api } = useConvexHttpClient()
  return await client.mutation(api.blogs.remove, { id })
})
