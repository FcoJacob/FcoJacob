export default defineSitemapEventHandler(async () => {
  const { client, api } = useConvexHttpClient()
  const blogs = await client.query(api.blogs.list, { onlyPublished: true })

  return blogs.map((blog) => ({
    loc: blog.locale === 'en' ? `/en/blog/${blog.slug}` : `/blog/${blog.slug}`,
    lastmod: new Date(blog.updatedAt ?? blog.createdAt).toISOString(),
  }))
})
