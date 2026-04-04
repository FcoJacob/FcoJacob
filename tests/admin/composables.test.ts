import { describe, it, expect } from 'vitest'

describe('useAdminApi composable', () => {
  it('exports all CRUD functions', async () => {
    const mod = await import('~~/layers/admin/app/composables/useAdminApi')
    const api = mod.useAdminApi()

    expect(api.createBlog).toBeTypeOf('function')
    expect(api.updateBlog).toBeTypeOf('function')
    expect(api.deleteBlog).toBeTypeOf('function')
    expect(api.createProject).toBeTypeOf('function')
    expect(api.updateProject).toBeTypeOf('function')
    expect(api.deleteProject).toBeTypeOf('function')
    expect(api.createLab).toBeTypeOf('function')
    expect(api.updateLab).toBeTypeOf('function')
    expect(api.deleteLab).toBeTypeOf('function')
    expect(api.upsertCv).toBeTypeOf('function')
  })
})
