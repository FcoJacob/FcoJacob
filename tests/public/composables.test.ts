import { describe, it, expect } from 'vitest'

describe('useGeneratePdf composable', () => {
  it('exports generate function and isGenerating ref', async () => {
    const mod = await import('~~/layers/public/app/composables/useGeneratePdf')
    const { generate, isGenerating } = mod.useGeneratePdf()

    expect(generate).toBeTypeOf('function')
    expect(isGenerating.value).toBe(false)
  })
})
