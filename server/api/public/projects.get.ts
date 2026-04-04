export default defineEventHandler(async (event) => {
  const { client, api } = useConvexHttpClient()
  const query = getQuery(event)
  return await client.query(api.projects.list, {})
})
