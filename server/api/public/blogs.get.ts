export default defineEventHandler(async (event) => {
  const { client, api } = useConvexHttpClient()
  const query = getQuery(event)
  return await client.query(api.blogs.list, {
    onlyPublished: true,
    locale: query.locale as string | undefined,
  })
})
