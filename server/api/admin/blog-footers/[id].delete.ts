export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const { client, api } = useConvexHttpClient()

  return await client.mutation(api.blogFooters.remove, {
    id: event.context.params?.id,
  } as never)
})
