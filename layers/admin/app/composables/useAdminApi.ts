import type { Id } from '~~/convex/_generated/dataModel'

export function useAdminApi() {
  async function createBlogFooter(data: {
    name: string
    content: {
      authorEyebrow: { es: string; en: string }
      authorName: string
      authorRole: { es: string; en: string }
      authorNote: { es: string; en: string }
      gratitudeNote: { es: string; en: string }
      authorImage: string
    }
  }): Promise<Id<'blogFooters'>> {
    return await $fetch<Id<'blogFooters'>>('/api/admin/blog-footers', {
      method: 'POST',
      body: data,
    })
  }

  async function updateBlogFooter(id: string, data: Record<string, unknown>) {
    return await $fetch(`/api/admin/blog-footers/${id}`, { method: 'PUT', body: data })
  }

  async function deleteBlogFooter(id: string) {
    return await $fetch(`/api/admin/blog-footers/${id}`, { method: 'DELETE' })
  }

  async function getResearchDocument(slug: string) {
    return await $fetch(`/api/admin/blog-research-document?slug=${encodeURIComponent(slug)}`)
  }

  async function createResearchDocumentUploadUrl() {
    return await $fetch('/api/admin/blog-research-document-upload-url', { method: 'POST' })
  }

  async function upsertResearchDocument(data: {
    slug: string
    title: string
    fileName: string
    mimeType: string
    storageId: string
  }) {
    return await $fetch('/api/admin/blog-research-document', { method: 'POST', body: data })
  }

  async function createBlog(data: {
    title: string
    slug: string
    content: string
    excerpt: string
    coverImage?: string
    tags?: string[]
    published: boolean
    locale: string
  }): Promise<Id<'blogs'>> {
    return await $fetch<Id<'blogs'>>('/api/admin/blogs', { method: 'POST', body: data })
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

  async function upsertCv(data: Record<string, unknown>, locale: string = 'es') {
    return await $fetch(`/api/admin/cv?locale=${locale}`, { method: 'PUT', body: data })
  }

  return {
    createBlogFooter,
    updateBlogFooter,
    deleteBlogFooter,
    getResearchDocument,
    createResearchDocumentUploadUrl,
    upsertResearchDocument,
    createBlog,
    updateBlog,
    deleteBlog,
    createProject,
    updateProject,
    deleteProject,
    upsertCv,
  }
}
