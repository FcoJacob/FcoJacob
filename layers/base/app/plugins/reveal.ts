import type { Directive, DirectiveBinding } from 'vue'

interface RevealOptions {
  delay?: number
  duration?: number
  y?: number
  x?: number
  stagger?: number
  selector?: string
  start?: string
  once?: boolean
}

function parseBinding(
  binding: DirectiveBinding<RevealOptions | number | undefined>,
): RevealOptions {
  if (typeof binding.value === 'number') return { delay: binding.value }
  return binding.value ?? {}
}

/**
 * v-reveal directive — fade-up on scroll powered by GSAP + ScrollTrigger.
 * Client-only plugin; GSAP is loaded lazily.
 *
 * Usage:
 *   <section v-reveal />
 *   <div v-reveal="{ delay: 0.15 }" />
 *   <ul v-reveal.stagger />                      ← staggers direct children
 *   <ul v-reveal="{ stagger: 0.08, selector: 'li' }" />
 */
function createDirective(
  gsap: typeof import('gsap').default,
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger,
): Directive<HTMLElement, RevealOptions | number | undefined> {
  return {
    mounted(el, binding) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const opts = parseBinding(binding)
      const staggerMode = binding.modifiers.stagger || opts.stagger !== undefined
      const selector = opts.selector ?? ':scope > *'
      const targets = staggerMode
        ? (Array.from(el.querySelectorAll(selector)) as HTMLElement[])
        : [el]

      if (!targets.length) return

      gsap.set(targets, {
        opacity: 0,
        y: opts.y ?? 28,
        x: opts.x ?? 0,
      })

      const tween = gsap.to(targets, {
        opacity: 1,
        y: 0,
        x: 0,
        duration: opts.duration ?? 0.9,
        delay: opts.delay ?? 0,
        stagger: staggerMode ? (opts.stagger ?? 0.08) : 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: opts.start ?? 'top 85%',
          once: opts.once ?? true,
        },
      })

      ;(el as HTMLElement & { __reveal?: gsap.core.Tween }).__reveal = tween
    },
    unmounted(el) {
      const tween = (el as HTMLElement & { __reveal?: gsap.core.Tween }).__reveal
      tween?.scrollTrigger?.kill()
      tween?.kill()
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === el)
        .forEach((st) => st.kill())
    },
  }
}

/** SSR-safe no-op directive so <div v-reveal /> renders without errors on the server. */
const ssrStub: Directive = {
  getSSRProps() {
    return {}
  },
}

export default defineNuxtPlugin(async (nuxtApp) => {
  // On the server register only a SSR-safe stub so <div v-reveal /> doesn't crash.
  if (!import.meta.client) {
    nuxtApp.vueApp.directive('reveal', ssrStub)
    return
  }

  const { default: gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  nuxtApp.vueApp.directive('reveal', createDirective(gsap, ScrollTrigger))
})
