/**
 * Client-only GSAP plugin.
 * Registers ScrollTrigger and sets global defaults.
 * Uses dynamic imports so the module graph never touches the SSR bundle.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  if (typeof window === 'undefined') return

  const { default: gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  gsap.defaults({
    ease: 'power3.out',
    duration: 0.8,
  })

  nuxtApp.hook('page:finish', () => {
    requestAnimationFrame(() => ScrollTrigger.refresh())
  })
})
