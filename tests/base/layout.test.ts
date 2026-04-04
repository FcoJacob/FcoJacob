import { describe, it, expect } from 'vitest'

describe('default layout', () => {
  it('layout file exists and exports a component', async () => {
    const mod = await import('~~/layers/base/app/layouts/default.vue')
    expect(mod.default).toBeDefined()
  })
})
