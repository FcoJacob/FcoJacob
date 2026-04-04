import { describe, it, expect } from 'vitest'

describe('admin auth middleware', () => {
  it('middleware file exists and exports default', async () => {
    const mod = await import('~~/layers/admin/app/middleware/auth.ts')
    expect(mod.default).toBeDefined()
  })
})
