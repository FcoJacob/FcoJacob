export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { client, api } = useConvexHttpClient()
  return await client.mutation(api.labs.update, { id, ...body })
})
