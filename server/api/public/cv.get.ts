export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = (query.locale as string) || 'es'
  const { client, api } = useConvexHttpClient()
  return await client.query(api.cv.get, { locale })
})
