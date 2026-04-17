interface MagneticOptions {
  /** Maximum pixels the element can travel from its origin */
  strength?: number
  /** How far (px) the cursor influences the element */
  radius?: number
}

/**
 * Attach a magnetic hover effect to an HTMLElement.
 * The element smoothly follows the cursor when it gets close.
 * GSAP is imported lazily so this composable is safe during SSR.
 */
export function useMagnetic(
  target: Ref<HTMLElement | null | undefined>,
  options: MagneticOptions = {},
) {
  const strength = options.strength ?? 18
  const radius = options.radius ?? 120

  type QuickTo = (value: number) => void
  let xTo: QuickTo | null = null
  let yTo: QuickTo | null = null
  let reducedMotion = false

  function onMove(event: MouseEvent) {
    if (!target.value || reducedMotion || !xTo || !yTo) return
    const rect = target.value.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = event.clientX - cx
    const dy = event.clientY - cy
    const distance = Math.hypot(dx, dy)
    if (distance > radius) {
      xTo(0)
      yTo(0)
      return
    }
    const factor = 1 - distance / radius
    xTo((dx / rect.width) * strength * factor * 2)
    yTo((dy / rect.height) * strength * factor * 2)
  }

  function onLeave() {
    xTo?.(0)
    yTo?.(0)
  }

  onMounted(async () => {
    if (typeof window === 'undefined') return
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || !target.value) return

    const { default: gsap } = await import('gsap')
    xTo = gsap.quickTo(target.value, 'x', { duration: 0.5, ease: 'power3.out' })
    yTo = gsap.quickTo(target.value, 'y', { duration: 0.5, ease: 'power3.out' })

    window.addEventListener('mousemove', onMove, { passive: true })
    target.value.addEventListener('mouseleave', onLeave)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('mousemove', onMove)
    target.value?.removeEventListener('mouseleave', onLeave)
  })
}
