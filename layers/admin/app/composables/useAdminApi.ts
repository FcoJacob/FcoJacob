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
    github?: string
    isActive: boolean
    highlights: string[]
    tags: string[]
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

  async function createLab(data: {
    name: string
    description: string
    url?: string
    tags: string[]
    published: boolean
  }) {
    return await $fetch('/api/admin/labs', { method: 'POST', body: data })
  }

  async function updateLab(id: string, data: Record<string, unknown>) {
    return await $fetch(`/api/admin/labs/${id}`, { method: 'PUT', body: data })
  }

  async function deleteLab(id: string) {
    return await $fetch(`/api/admin/labs/${id}`, { method: 'DELETE' })
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
    createLab,
    updateLab,
    deleteLab,
    upsertCv,
  }
}
