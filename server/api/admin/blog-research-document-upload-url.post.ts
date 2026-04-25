export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const { client, api } = useConvexHttpClient()
  return await client.mutation(api.researchDocuments.generateUploadUrl, {})
})
