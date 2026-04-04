import { describe, it, expect } from 'vitest'

describe('login page', () => {
  it('login page component exists and exports default', async () => {
    const mod = await import('~~/layers/admin/app/pages/admin/login.vue')
    expect(mod.default).toBeDefined()
  })
})
