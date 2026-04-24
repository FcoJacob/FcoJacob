export function useAdminApi() {
  async function createBlog(data: {
    title: string
    slug: string
    content: string
    excerpt: string
    coverImage?: string
    published: boolean
    locale: string
  }) {
    return await $fetch('/api/admin/blogs', { method: 'POST', body: data })
  }

  async function updateBlog(id: string, data: Record<string, unknown>) {
    return await $fetch(`/api/admin/blogs/${id}`, { method: 'PUT', body: data })
  }

  async function deleteBlog(id: string) {
    return await $fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' })
  }

  async function createProject(data: {
    name: string
    description: string
    url?: string
    thumbnail?: string
    tags: string[]
    isActive: boolean
    order: number
  }) {
    return await $fetch('/api/admin/projects', { method: 'POST', body: data })
  }

  async function updateProject(id: string, data: Record<string, unknown>) {
    return await $fetch(`/api/admin/projects/${id}`, { method: 'PUT', body: data })
  }

  async function deleteProject(id: string) {
    return await $fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
  }

  async function upsertCv(data: Record<string, unknown>) {
    return await $fetch('/api/admin/cv', { method: 'PUT', body: data })
  }

  return {
    createBlog,
    updateBlog,
    deleteBlog,
    createProject,
    updateProject,
    deleteProject,
    upsertCv,
  }
}
