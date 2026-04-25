export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const body = await readBody(event)
  const parsed = blogResearchDocumentSchema.parse(body)
  const { client, api } = useConvexHttpClient()

  return await client.mutation(api.researchDocuments.upsertForSlug, parsed as never)
})
