export default defineEventHandler(async () => {
  const { client, api } = useConvexHttpClient()
  return await client.query(api.labs.list, { onlyPublished: true })
})
