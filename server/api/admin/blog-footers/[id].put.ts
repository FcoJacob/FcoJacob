export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const body = await readBody(event)
  const parsed = blogFooterPresetUpdateSchema.parse(body)
  const { client, api } = useConvexHttpClient()

  return await client.mutation(api.blogFooters.update, {
    id: event.context.params?.id,
    ...parsed,
  } as never)
})
