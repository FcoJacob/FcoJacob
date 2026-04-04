export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readBody(event)
  const { client, api } = useConvexHttpClient()
  return await client.mutation(api.cv.upsert, body)
})
