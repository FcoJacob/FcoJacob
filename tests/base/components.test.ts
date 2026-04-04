import { describe, it, expect } from 'vitest'

describe('base components', () => {
  it('AppHeader exports a component', async () => {
    const mod = await import('~~/layers/base/app/components/AppHeader.vue')
    expect(mod.default).toBeDefined()
  })

  it('AppFooter exports a component', async () => {
    const mod = await import('~~/layers/base/app/components/AppFooter.vue')
    expect(mod.default).toBeDefined()
  })

  it('LanguageSwitcher exports a component', async () => {
    const mod = await import('~~/layers/base/app/components/LanguageSwitcher.vue')
    expect(mod.default).toBeDefined()
  })
})
