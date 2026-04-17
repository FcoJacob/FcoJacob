/**
 * Animate a numeric value from `from` → `to` and write each frame
 * as text into the referenced element. Respects prefers-reduced-motion
 * by snapping directly to the final value.
 * GSAP is imported lazily so this composable is safe during SSR.
 */
export function useCounter(
  target: Ref<HTMLElement | null | undefined>,
  to: number,
  options: {
    from?: number
    duration?: number
    prefix?: string
    suffix?: string
    delay?: number
  } = {},
) {
  const { from = 0, duration = 1.6, prefix = '', suffix = '', delay = 0 } = options

  onMounted(async () => {
    if (typeof window === 'undefined' || !target.value) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      target.value.textContent = `${prefix}${to}${suffix}`
      return
    }

    const { default: gsap } = await import('gsap')
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    gsap.registerPlugin(ScrollTrigger)

    const state = { value: from }
    gsap.to(state, {
      value: to,
      duration,
      delay,
      ease: 'power2.out',
      onUpdate: () => {
        if (!target.value) return
        target.value.textContent = `${prefix}${Math.round(state.value)}${suffix}`
      },
      scrollTrigger: {
        trigger: target.value,
        start: 'top 90%',
        once: true,
      },
    })
  })
}
